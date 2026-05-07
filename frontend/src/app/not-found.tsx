import { SimpleArtErrorPage } from '@/components/pages/SimpleArtErrorPage';

export const metadata = {
  title: '404 — страница не найдена',
};

export default function NotFound() {
  return (
    <SimpleArtErrorPage
      code="404"
      titleKey="errors.oops.404.title"
      subtitleKey="errors.oops.404.subtitle"
      artAriaLabelKey="errors.oops.404.aria"
    />
  );
}

