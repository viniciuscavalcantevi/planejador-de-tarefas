import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import type { Profile, Task } from "../types";
import { isOverdue } from "../lib/taskRules";

interface CalendarViewProps {
  tasks: Task[];
  members: { userId: string; profile: Profile }[];
  onOpenTask: (taskId: string) => void;
}

export function CalendarView({ tasks, onOpenTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDayDate = new Date(year, month + 1, 0).getDate();

  // Dias do mês anterior para preencher a primeira semana
  const prevLastDayDate = new Date(year, month, 0).getDate();
  const prevDays = Array.from({ length: firstDayIndex }).map((_, i) => ({
    dayNumber: prevLastDayDate - firstDayIndex + i + 1,
    isCurrentMonth: false,
    dateString: "",
  }));

  // Dias do mês atual
  const currentMonthDays = Array.from({ length: lastDayDate }).map((_, i) => {
    const day = i + 1;
    const dayPadded = String(day).padStart(2, "0");
    const monthPadded = String(month + 1).padStart(2, "0");
    const dateString = `${year}-${monthPadded}-${dayPadded}`;
    return {
      dayNumber: day,
      isCurrentMonth: true,
      dateString,
    };
  });

  const totalSlots = Math.ceil((prevDays.length + currentMonthDays.length) / 7) * 7;
  const nextDaysCount = totalSlots - (prevDays.length + currentMonthDays.length);
  const nextDays = Array.from({ length: nextDaysCount }).map((_, i) => ({
    dayNumber: i + 1,
    isCurrentMonth: false,
    dateString: "",
  }));

  const allCalendarDays = [...prevDays, ...currentMonthDays, ...nextDays];

  const todayString = new Date().toISOString().slice(0, 10);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      {/* Header do Calendário */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3.5">
        <div className="flex items-center gap-3">
          <CalendarIcon size={20} className="text-[#0066CC]" />
          <h2 className="text-base font-bold text-gray-900 tracking-tight capitalize">
            {monthNames[month]} <span className="font-mono text-gray-500">{year}</span>
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={goToToday}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
          >
            Hoje
          </button>
          <div className="flex items-center rounded-md border border-gray-200 bg-white shadow-2xs">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-l-md"
              title="Mês anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="h-4 w-[1px] bg-gray-200" />
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-r-md"
              title="Próximo mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Dias da Semana */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500 py-2">
        <span>Dom</span>
        <span>Seg</span>
        <span>Ter</span>
        <span>Qua</span>
        <span>Qui</span>
        <span>Sex</span>
        <span>Sáb</span>
      </div>

      {/* Grade de Dias */}
      <div className="grid flex-1 grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-200 overflow-y-auto">
        {allCalendarDays.map((cell, idx) => {
          const isToday = cell.dateString === todayString;
          const dayTasks = cell.dateString
            ? tasks.filter((t) => t.dueDate === cell.dateString)
            : [];

          return (
            <div
              key={idx}
              className={`min-h-[110px] p-2 flex flex-col transition-colors ${
                cell.isCurrentMonth ? "bg-white" : "bg-gray-50/60 text-gray-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday
                      ? "bg-[#0066CC] text-white shadow-xs font-bold"
                      : cell.isCurrentMonth
                      ? "text-gray-700"
                      : "text-gray-400"
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {dayTasks.length > 0 && (
                  <span className="text-[10px] font-semibold text-gray-400">
                    {dayTasks.length} {dayTasks.length === 1 ? "tarefa" : "tarefas"}
                  </span>
                )}
              </div>

              {/* Lista de Tarefas do Dia */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px]">
                {dayTasks.map((task) => {
                  const overdue = isOverdue(task.dueDate, task.status);
                  const isDone = task.status === "concluido";

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onOpenTask(task.id)}
                      className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[11px] font-medium transition-all shadow-2xs ${
                        isDone
                          ? "bg-gray-100 text-gray-400 line-through"
                          : overdue
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : task.priority === "urgente"
                          ? "bg-orange-50 text-orange-800 border border-orange-200"
                          : "bg-blue-50 text-[#0066CC] border border-blue-100 hover:bg-blue-100/70"
                      }`}
                    >
                      {overdue && !isDone ? (
                        <AlertCircle size={11} className="shrink-0 text-red-600" />
                      ) : (
                        <Clock size={11} className="shrink-0 opacity-60" />
                      )}
                      <span className="truncate flex-1">{task.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
