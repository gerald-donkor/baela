import { CourseLibrary } from "@/components/courses/course-library";

export const metadata = {
  title: "Course collection",
  description:
    "Explore six thoughtful courses in development, design, and creative coding.",
};

export default function CoursesPage() {
  return <CourseLibrary />;
}
