# Image Upload System — Implementation Roadmap

> Bu belge, brand üzerinde kurulan image upload mimarisini diğer entity'lere (categories, products, vb.) uygulayacak agentlar için referans rehberdir. Brand implementasyonu **tamamlanmış referans örnek**tir.

---

## Mimari Genel Bakış

Her entity, kendi route'u altında image endpoint'lerine sahiptir. Generic bir upload endpoint yoktur. Upload, silme ve sıralama tümüyle backend tarafında kontrol edilir.

```
POST   /admin/{entity}/{id}/images          → resim yükle
DELETE /admin/{entity}/{id}/images/:imageId → resim sil
POST   /admin/{entity}/save                 → kaydet (existingImages ile sortOrder normalize)
```

---

## Tamamlanmış Referans: Brand

Aşağıdaki dosyalar brand için tamamlanmış olup diğer entity'ler için birebir şablon görevi görür.

### Backend

| Dosya | Ne yapıldı |
|-------|-----------|
| `apps/backend/src/app/admin/brands/brands.module.ts` | `UploadModule` import edildi |
| `apps/backend/src/app/admin/brands/brands.controller.ts` | `POST :id/images` ve `DELETE :id/images/:imageId` endpoint'leri eklendi |
| `apps/backend/src/app/admin/brands/brands.service.ts` | `uploadBrandImage`, `deleteBrandImage`, saveBrand'de sortOrder normalize eklendi |

#### Controller pattern (kopyala-yapıştır, entity adını değiştir)

```ts
@Post(':id/images')
@UseInterceptors(FileInterceptor('file'))
async uploadBrandImage(
  @Param('id') id: string,
  @UploadedFile(new FileValidationPipe({ allowedTypes: ['IMAGE'], maxSize: 5 * 1024 * 1024 }))
  file: Express.Multer.File,
) {
  return this.brandsService.uploadBrandImage(id, file);
}

@Delete(':id/images/:imageId')
@HttpCode(HttpStatus.NO_CONTENT)
async deleteBrandImage(
  @Param('id') brandId: string,
  @Param('imageId') imageId: string,
) {
  return this.brandsService.deleteBrandImage(brandId, imageId);
}
```

#### Service pattern

```ts
// uploadBrandImage:
// 1. Entity var mı kontrol et (NotFoundException)
// 2. image count >= MAX → BadRequestException('backend.errors.max_images_exceeded')
// 3. uploadService.uploadFile(file, { ownerType, ownerId, isNeedWebp: true, isNeedThumbnail: false })
// 4. prisma.image.update: sortOrder = imageCount (en sona ekle)
// 5. return UploadResult

// deleteBrandImage:
// 1. image.findFirst({ id: imageId, brandId }) → ownership check
// 2. uploadService.deleteImage(imageId)
// 3. Kalan image'ları sortOrder'a göre sırala ve 0'dan re-index et (gap'siz normalize)

// saveBrand (existingImages normalize):
// 1. existingImages'ı sortOrder'a göre sırala
// 2. 0'dan başlayarak her birini güncelle (frontend'e körü körüne güvenmeme)
```

**Kritik import'lar:**
- `UploadModule` → module'e import et
- `UploadService` → constructor'a inject et
- `FileValidationPipe` → `../../../core/pipes/file-validation.pipe`
- `FileInterceptor` → `@nestjs/platform-express`
- `BadRequestException` → `@nestjs/common`

### Schema (packages/schemas)

`packages/schemas/CLAUDE.md` kurallarına uy. Brand şeması referans pattern:

```ts
// BaseFooSchema: id, slug, sortOrder, translations, existingImages (dropzoneFileSchema OLMAZ)
// checkFoo: duplicate locale gibi cross-field validations
// FooSchema = BaseFooSchema.safeExtend({ images: dropzoneFileSchema({ maxFiles: N, ... }) })
// BackendFooSchema = BaseFooSchema.check(checkFoo)  ← .omit() KULLANMA
```

`existingImageSchema` → `packages/schemas/src/common/common-schemas.ts` içinde paylaşımlı:
```ts
z.object({ id: string, url: string, fileType: FileType, sortOrder: number })
```

`IMAGE_OWNER_FIELD_MAP` ve `IMAGE_OWNER_PATH_MAP` → `packages/types/src/admin/upload/index.ts`
Entity için entry yoksa **önce buraya ekle**.

### Frontend

#### Hook: `useImageUpload`

`apps/web/core/hooks/useImageUpload.ts` — **değişiklik gerekmez**, `basePath` prop'u ile her entity için çalışır:

```ts
const { deletingIds, isUploading, deleteImage, uploadFiles } = useImageUpload({
  basePath: `/admin/{entity}/${entityId}/images`,
  onDeleteError: () => { /* notification */ },
  onUploadError: () => { /* notification */ },
});
```

#### Dropzone bileşeni props

```tsx
<Dropzone
  value={field.value}              // DropzoneFile[] — yeni dosyalar
  onChange={field.onChange}
  existingFiles={existingFiles}    // RemoteFile[] — backend'den gelen mevcut dosyalar
  onRemoveExisting={handleRemoveExisting}   // deleteImage çağırır, state'i günceller
  onReorderExisting={setExistingFiles}      // DnD sonrası existing sırasını günceller
  deletingIds={deletingIds}        // hangi remote file silinmekte, spinner için
  loading={isUploading}
  maxFiles={N}                     // frontend + backend aynı limit olmalı
  multiple
  accept={getMimePatterns([FileType.IMAGE])}
  maxSize={5 * 1024 * 1024}
/>
```

**`existingFiles` state yönetimi:**

```ts
const [existingFiles, setExistingFiles] = useState<RemoteFile[]>([]);

// initialExisting: data.images → RemoteFile[] dönüşümü
const initialExisting = useMemo<RemoteFile[]>(() => {
  if (!data || isNew) return [];
  return data.images?.map((img) => ({
    id: img.id,
    url: img.url,
    fileType: img.fileType,
    order: img.sortOrder,
  })) ?? [];
}, [data, isNew]);

useMemo(() => { setExistingFiles(initialExisting); }, [initialExisting]);

const handleRemoveExisting = useCallback(async (file: RemoteFile) => {
  const ok = await deleteImage(file);
  if (ok) setExistingFiles((prev) => prev.filter((f) => f.id !== file.id));
}, [deleteImage]);
```

**`onSubmit` — upload sonuçlarını existingImages ile merge et:**

```ts
const onSubmit = async (formData) => {
  const newImages = formData.images ?? [];
  let uploadResults = [];
  if (newImages.length > 0) {
    uploadResults = await uploadFiles(newImages);
  }

  const allExisting = [
    ...existingFiles.map((f, i) => ({
      id: f.id, url: f.url, fileType: f.fileType, sortOrder: i,
    })),
    ...uploadResults.map((r, i) => ({
      id: r.imageId, url: r.url, fileType: r.fileType,
      sortOrder: existingFiles.length + i,
    })),
  ];

  await saveEntity.mutateAsync({ ...formData, id: entityId, images: undefined, existingImages: allExisting });
  router.push('/admin/...');
};
```

#### React Query hook pattern

```ts
// useSaveEntity — save sonrası HER ZAMAN navigate ediliyorsa:
onSuccess: (result) => {
  queryClient.removeQueries({ queryKey: DATA_ACCESS_KEYS.admin.{entity}.detail(result.id) });
  queryClient.invalidateQueries({ queryKey: DATA_ACCESS_KEYS.admin.{entity}.list });
}

// Aynı sayfada kalan mutation'lar için (tag children, inline edit vb.):
// invalidateQueries kullan, removeQueries değil
```

> **Kural:** Save sonrası `router.push()` ile başka sayfaya gidiliyorsa → `removeQueries(detail)`.
> Aynı sayfada kalınıyorsa → `invalidateQueries(detail)`.

---

## Uygulanacak Entity'ler

### Checklist — Her entity için yapılacaklar

#### Backend
- [ ] `{Entity}Module`'e `UploadModule` import et
- [ ] `IMAGE_OWNER_FIELD_MAP` ve `IMAGE_OWNER_PATH_MAP`'e entity entry'si ekle (yoksa)
- [ ] Controller'a `POST :id/images` ve `DELETE :id/images/:imageId` endpoint'leri ekle
- [ ] Service'e `upload{Entity}Image`, `delete{Entity}Image` metodları ekle
- [ ] `save{Entity}`'de `existingImages` sortOrder normalize et (sort → 0'dan re-index)

#### Schema
- [ ] `Base{Entity}Schema`: `existingImages: z.array(existingImageSchema)` ekle
- [ ] `{Entity}Schema`: `.safeExtend({ images: dropzoneFileSchema({ maxFiles: N }) })`
- [ ] `Backend{Entity}Schema`: `Base{Entity}Schema.check(check{Entity})` — `.omit()` KULLANMA

#### Frontend
- [ ] Page'de `existingFiles` state ekle (`RemoteFile[]`)
- [ ] `useImageUpload({ basePath: /admin/{entity}/${id}/images })` hookunu bağla
- [ ] `Dropzone`'a `existingFiles`, `onRemoveExisting`, `onReorderExisting`, `deletingIds` prop'larını geç
- [ ] `onSubmit`'te upload sonuçlarını `existingImages`'a merge et
- [ ] `use{Save}Entity` hook'unda `removeQueries(detail)` + `invalidateQueries(list)` pattern'ini uygula

---

## Önemli Notlar

### Zod v4 Kuralları
- `.omit()` → `.check()` olan schema'larda runtime error verir. **ASLA kullanma.**
- `.extend()` → `.check()` refinement'larını düşürür. **Her zaman `.safeExtend()` kullan.**

### Dropzone DnD Sırası
- `allItems` = `[...existingFiles, ...localFiles]` birleşimi, `order` field'ına göre `.sort()` ile sıralanır
- `onReorderExisting` çağrıldığında `setExistingFiles` ile state güncellenir → `allItems` yeniden hesaplanır
- `onSubmit`'te `existingFiles` dizisinin index sırası = `sortOrder` değeri

### Max Files Limiti
- Frontend: `Dropzone maxFiles` prop'u (existing + local toplam)
- Backend: `uploadBrandImage`'de `imageCount >= MAX` kontrolü
- Schema: `dropzoneFileSchema({ maxFiles: N })` ile Zod validasyonu
- **Üçü birbiriyle tutarlı olmalı.**

### i18n Error Keys
- `'backend.errors.max_images_exceeded'` → `packages/i18n/src/locales/{en,tr}/backend.json`'a ekle
- `'backend.errors.image_not_found'` → aynı dosyaya ekle (yoksa)

---

## Referans Dosyalar

| Dosya | Amaç |
|-------|------|
| `apps/backend/src/app/admin/brands/brands.controller.ts` | Controller pattern referansı |
| `apps/backend/src/app/admin/brands/brands.service.ts` | Service pattern referansı |
| `apps/backend/src/app/admin/brands/brands.module.ts` | Module import referansı |
| `apps/web/app/(admin)/admin/products/brands/[id]/page.tsx` | Frontend form referansı |
| `apps/web/core/hooks/useImageUpload.ts` | Upload hook (değişmez, basePath ile kullan) |
| `packages/schemas/src/admin/brands/brand-zod-schema.ts` | Schema pattern referansı |
| `packages/schemas/src/common/common-schemas.ts` | `existingImageSchema`, `dropzoneFileSchema` |
| `packages/types/src/admin/upload/index.ts` | `IMAGE_OWNER_FIELD_MAP`, `IMAGE_OWNER_PATH_MAP`, `UploadResult` |
| `apps/backend/src/app/upload/upload.service.ts` | `UploadService.uploadFile()`, `.deleteImage()` |
| `apps/backend/src/core/pipes/file-validation.pipe.ts` | `FileValidationPipe` |
| `packages/schemas/CLAUDE.md` | Schema kuralları (zorunlu oku) |
