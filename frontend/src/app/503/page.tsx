import { SimpleArtErrorPage } from '@/components/pages/SimpleArtErrorPage';

export const metadata = {
  title: '503 — сервис недоступен',
};

export default function ServiceUnavailablePage() {
  return (
    <SimpleArtErrorPage
      code="503"
      titleKey="errors.oops.503.title"
      subtitleKey="errors.oops.503.subtitle"
      artAriaLabelKey="errors.oops.503.aria"
    />
  );
}

