import { requireTeacher } from "@/lib/dal";
import { getT } from "@/i18n/server";
import { studentRows } from "@/lib/teacher-data";
import { AddStudentForm } from "./add-student-form";
import { StudentTable } from "./student-table";

export default async function StudentsPage() {
  const teacher = await requireTeacher();
  const { locale, t } = await getT();
  const students = await studentRows(teacher.id);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem] xl:items-start">
      <section className="card flex min-w-0 flex-col gap-3">
        <h1 className="h1">
          {t.students.title} <span className="text-muted tabular-nums">{students.length}</span>
        </h1>
        {students.length ? <StudentTable students={students} t={t} locale={locale} /> : <p className="font-semibold text-muted">{t.students.empty}</p>}
      </section>
      <section className="card border-b-4 xl:sticky xl:top-8">
        <h2 className="h2 mb-4">{t.students.add}</h2>
        <AddStudentForm t={t} defaultLocale={locale} />
      </section>
    </div>
  );
}
