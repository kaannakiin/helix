import { Module } from '@nestjs/common';
import {
  AcceptLanguageResolver,
  CookieResolver,
  HeaderResolver,
  I18nModule as NestI18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { getBackendLocalesPath } from './i18n.paths';

@Module({
  imports: [
    NestI18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: getBackendLocalesPath(),
        watch: process.env['NODE_ENV'] === 'development',
      },
      resolvers: [
        new CookieResolver(['LOCALE']),
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
  ],
})
export class I18nModule {}
