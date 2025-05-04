import { format, parseISO } from 'date-fns';
import { enUS, ptBR } from 'date-fns/locale';

const locales = {
  'en': enUS,
  'pt-BR': ptBR,
};

export const formatDate = (dateString, formatStr = 'PPpp', language = 'en') => {
  const date = parseISO(dateString);
  const locale = locales[language] || locales.en;
  
  return format(date, formatStr, { locale });
}; 