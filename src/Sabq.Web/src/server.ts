import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express, { Express, Request, Response, NextFunction } from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';

const legacyQuestionDetailPath = /^\/questions\/[^/]+\/[^/]+\/?$/;
const legacyQuestionListingPath = /^\/questions(?:\/[^/]+)?\/?$/;
const prerenderedPublicPath = /^\/(?:about|contact|privacy-policy|terms-and-conditions|editorial-policy|corrections|team|learn(?:\/(?:arabic-language-basics|math-and-logic|science-around-us|life-science|earth-and-space|climate-and-water|digital-citizenship|world-geography|egyptian-heritage|arab-scientific-heritage|historical-thinking|reading-and-research))?)\/?$/;
const dynamicApplicationPath = /^\/(?:home|login|admin(?:\/login)?|questions(?:\/[^/]+)?|lobby\/[^/]+|game\/[^/]+|results\/[^/]+)\/?$/;

function isKnownApplicationPath(pathname: string): boolean {
  return pathname === '/' || prerenderedPublicPath.test(pathname) || dynamicApplicationPath.test(pathname);
}

export function app(): Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Serve static files from browser folder
  server.get('*.*', express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
  }));

  const renderAngular = (req: Request, res: Response, next: NextFunction) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html: string) => res.send(html))
      .catch((err: Error) => next(err));
  };

  // Keep removed question-detail URLs out of the SPA so crawlers receive 410.
  server.get('*', (req: Request, res: Response, next: NextFunction) => {
    const pathname = req.path;

    if (legacyQuestionDetailPath.test(pathname)) {
      return res.status(410).type('text/plain').send('This legacy question page has been retired.');
    }

    if (pathname !== '/' && pathname.endsWith('/') && isKnownApplicationPath(pathname)) {
      const queryStart = req.originalUrl.indexOf('?');
      const query = queryStart >= 0 ? req.originalUrl.slice(queryStart) : '';
      return res.redirect(301, `${pathname.replace(/\/+$/, '')}${query}`);
    }

    if (!isKnownApplicationPath(pathname)) {
      return res.status(404).type('text/plain').send('Not Found');
    }

    if (legacyQuestionListingPath.test(pathname)) {
      res.set('X-Robots-Tag', 'noindex, follow');
    }

    return renderAngular(req, res, next);
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
