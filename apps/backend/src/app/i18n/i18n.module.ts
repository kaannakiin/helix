import { Module } from '@nestjs/common';
import {
  I18nModule as NestI18nModule,
  AcceptLanguageResolver,
  CookieResolver,
  HeaderResolver,
  QueryResolver,
} from 'nestjs-i18n';
import { getBackendLocalesPath } from './i18n.paths.js';

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
