import { addWeeks, format, parseISO, isBefore, isSameMonth } from 'date-fns';
import { id } from 'date-fns/locale';

export const generateWeeklyDates = () => {
  const dates = [];
  let currentDate = parseISO('2026-04-19'); // 19 April 2026
  const endDate = parseISO('2027-02-01'); // Sampai sebelum Februari 2027

  while (isBefore(currentDate, endDate)) {
    dates.push(format(currentDate, 'yyyy-MM-dd'));
    currentDate = addWeeks(currentDate, 1);
  }

  return dates;
};

export const formatDateID = (dateStr) => {
  if (!dateStr) return '';
  return format(parseISO(dateStr), 'dd MMMM yyyy', { locale: id });
};
