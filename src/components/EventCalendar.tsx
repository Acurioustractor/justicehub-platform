'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  start_date: string;
  end_date?: string;
  event_type: string;
  location_name?: string;
  location_state?: string;
  is_featured?: boolean;
}

interface EventCalendarProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  onDateClick?: (date: Date) => void;
}

const eventTypeColors: Record<string, string> = {
  launch: 'bg-ochre-500',
  workshop: 'bg-eucalyptus-500',
  conference: 'bg-blue-500',
  webinar: 'bg-purple-500',
  meeting: 'bg-gray-500',
  exhibition: 'bg-pink-500',
};

export default function EventCalendar({
  events,
  onEventClick,
  onDateClick,
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Group events by date
  const eventsByDate: Record<string, Event[]> = {};
  events.forEach(event => {
    const dateKey = new Date(event.start_date).toISOString().split('T')[0];
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  // Generate calendar days
  const calendarDays: (number | null)[] = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
  };

  const getEventsForDay = (day: number) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventsByDate[dateKey] || [];
  };

  return (
    <div className="border-2 border-black bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-black bg-sand-50">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-sand-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={goToToday}
            className="text-sm font-medium px-3 py-1 border border-black hover:bg-ochre-50 transition-colors"
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-sand-200 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b-2 border-black">
        {dayNames.map(day => (
          <div
            key={day}
            className="p-2 text-center text-sm font-bold uppercase tracking-wider text-earth-600 border-r border-black last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dayEvents = day ? getEventsForDay(day) : [];
          const hasEvents = dayEvents.length > 0;

          return (
            <div
              key={index}
              className={`
                min-h-[100px] p-2 border-r border-b border-gray-200 last:border-r-0
                ${day ? 'cursor-pointer hover:bg-sand-50' : 'bg-gray-50'}
                ${isToday(day!) ? 'bg-ochre-50' : ''}
              `}
              onClick={() => {
                if (day && onDateClick) {
                  onDateClick(new Date(year, month, day));
                }
              }}
            >
              {day && (
                <>
                  <div className={`
                    text-sm font-medium mb-1
                    ${isToday(day) ? 'w-7 h-7 rounded-full bg-ochre-500 text-white flex items-center justify-center' : ''}
                  `}>
                    {day}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <button
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEventClick) {
                            onEventClick(event);
                          }
                        }}
                        className={`
                          w-full text-left text-xs p-1 rounded truncate text-white font-medium
                          ${eventTypeColors[event.event_type] || 'bg-gray-500'}
                          hover:opacity-80 transition-opacity
                        `}
                        title={event.title}
                      >
                        {event.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-earth-600 font-medium">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 border-t-2 border-black bg-sand-50">
        <div className="flex flex-wrap gap-4 text-sm">
          {Object.entries(eventTypeColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${color}`} />
              <span className="capitalize text-earth-600">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
