import thumbnailSources from "@/public/images/courses/sources.json";

export type SampleLesson = {
  id: string;
  title: string;
  duration: string;
  goal: string;
  section: string;
  number: number;
};

export type SampleCourse = {
  slug: string;
  title: string;
  shortTitle: string;
  category: "Development" | "Design" | "Creative";
  level: string;
  summary: string;
  description: string;
  instructor: { name: string; initials: string; role: string };
  duration: string;
  completed: number;
  current: number;
  students: string;
  art: "next" | "react" | "typescript" | "design" | "node" | "motion";
  thumbnail: string;
  outcomes: string[];
  project: string;
  filename: string;
  code: string[];
  sections: { title: string; lessons: SampleLesson[] }[];
};

type LessonSeed = [title: string, duration: string, goal: string];
type CourseSeed = Omit<SampleCourse, "sections" | "thumbnail"> & {
  sections: { title: string; lessons: LessonSeed[] }[];
};

const seeds: CourseSeed[] = [
  {
    slug: "full-stack-nextjs",
    title: "Full-stack Next.js",
    shortTitle: "Next.js",
    category: "Development",
    level: "Intermediate",
    art: "next",
    summary: "From your first route to a real-world full-stack app.",
    description:
      "Build a thoughtful workspace app from the ground up. Connect a database, create a clear interface, and bring the whole experience together with authentication and a polished deployment.",
    instructor: {
      name: "Alex Morgan",
      initials: "AM",
      role: "Full-stack developer & educator",
    },
    duration: "4h 32m",
    completed: 6,
    current: 6,
    students: "1,248",
    project:
      "A personal workspace with projects, notes, and a member dashboard.",
    outcomes: [
      "Structure an app with layouts and routes",
      "Connect your UI to a PostgreSQL database",
      "Create a secure authentication flow",
      "Ship a complete, accessible workspace",
    ],
    filename: "session.ts",
    code: [
      "import { auth } from '@/lib/auth';",
      "import { redirect } from 'next/navigation';",
      "",
      "export async function getCurrentUser() {",
      "  const session = await auth.getSession();",
      "",
      "  if (!session?.user) {",
      "    redirect('/sign-in');",
      "  }",
      "",
      "  return {",
      "    id: session.user.id,",
      "    name: session.user.name,",
      "    email: session.user.email,",
      "  };",
      "}",
    ],
    sections: [
      {
        title: "Getting started",
        lessons: [
          [
            "Your next full-stack project",
            "06:24",
            "Understand the workspace we will build and how its parts fit together.",
          ],
          [
            "Setting up your environment",
            "12:18",
            "Set up a clean local project and the tools you will use throughout the course.",
          ],
          [
            "Routes, layouts, and pages",
            "14:40",
            "Give your app a clear route structure and reusable page layouts.",
          ],
          [
            "A foundation for your project",
            "17:18",
            "Organize components and establish a small, consistent design system.",
          ],
        ],
      },
      {
        title: "Building the app",
        lessons: [
          [
            "Connecting your database",
            "20:05",
            "Model projects and notes, then connect them to a PostgreSQL database.",
          ],
          [
            "Creating the data layer",
            "23:13",
            "Write reusable queries and keep data access close to the server.",
          ],
          [
            "Setting up authentication",
            "32:10",
            "Create a session-aware experience and protect the pages that belong to a user.",
          ],
          [
            "Building the dashboard",
            "28:45",
            "Bring projects, recent activity, and helpful empty states into one interface.",
          ],
        ],
      },
      {
        title: "Bringing it all together",
        lessons: [
          [
            "Forms and validation",
            "26:32",
            "Build readable forms with helpful validation and clear feedback.",
          ],
          [
            "Loading and error states",
            "21:27",
            "Make the app feel considered while data loads or something goes wrong.",
          ],
          [
            "Preparing for deployment",
            "24:18",
            "Review your environment, assets, and production configuration before release.",
          ],
          [
            "Your finished workspace",
            "25:22",
            "Review the complete project and choose the next improvements you want to make.",
          ],
        ],
      },
    ],
  },
  {
    slug: "react-from-first-principles",
    title: "React from first principles",
    shortTitle: "React",
    category: "Development",
    level: "Beginner",
    art: "react",
    summary: "Build a mental model that makes React click.",
    description:
      "Get comfortable thinking in components. Move from a simple interface to a working reading list while learning how state, events, and reusable patterns shape a React application.",
    instructor: {
      name: "Maya Chen",
      initials: "MC",
      role: "Frontend engineer & mentor",
    },
    duration: "3h 18m",
    completed: 3,
    current: 3,
    students: "986",
    project:
      "A reading list with reusable book cards, filters, and a detail view.",
    outcomes: [
      "Break interfaces into useful components",
      "Model state and respond to user actions",
      "Compose reusable UI patterns",
      "Build a complete reading-list interface",
    ],
    filename: "reading-list.tsx",
    code: [
      "import { useState } from 'react';",
      "",
      "export function ReadingList({ books }) {",
      "  const [filter, setFilter] = useState('all');",
      "",
      "  const visibleBooks = books.filter((book) =>",
      "    filter === 'all' || book.status === filter",
      "  );",
      "",
      "  return (",
      '    <section className="reading-list">',
      "      <BookFilter onChange={setFilter} />",
      "      {visibleBooks.map((book) => (",
      "        <BookCard key={book.id} book={book} />",
      "      ))}",
      "    </section>",
      "  );",
      "}",
    ],
    sections: [
      {
        title: "Thinking in components",
        lessons: [
          [
            "A different way to build UI",
            "08:12",
            "See how a component-based approach changes the way you build interfaces.",
          ],
          [
            "Your first component",
            "14:25",
            "Write a book card component using JSX and familiar HTML elements.",
          ],
          [
            "Passing data with props",
            "16:38",
            "Make the book card reusable by passing its content through props.",
          ],
          [
            "Composing an interface",
            "19:20",
            "Combine small components into a coherent reading-list page.",
          ],
        ],
      },
      {
        title: "Making things interactive",
        lessons: [
          [
            "Understanding state",
            "22:15",
            "Choose the state your interface needs and update it predictably.",
          ],
          [
            "Events and user actions",
            "17:42",
            "Connect buttons and inputs to focused event handlers.",
          ],
          [
            "Lists, keys, and filters",
            "21:16",
            "Render a collection of books and filter it without mutating the source data.",
          ],
          [
            "Working with forms",
            "18:50",
            "Create a controlled form for adding a new book to your collection.",
          ],
        ],
      },
      {
        title: "Reusable patterns",
        lessons: [
          [
            "Sharing state",
            "20:04",
            "Move shared state to the right component and keep the data flow clear.",
          ],
          [
            "Effects with intention",
            "15:36",
            "Recognize when your component needs to synchronize with an external system.",
          ],
          [
            "Your first custom hook",
            "14:52",
            "Extract a focused reading-list behavior into a reusable hook.",
          ],
          [
            "Polishing your reading list",
            "08:50",
            "Finish the interface with accessible controls and thoughtful empty states.",
          ],
        ],
      },
    ],
  },
  {
    slug: "typescript-in-practice",
    title: "TypeScript in practice",
    shortTitle: "TypeScript",
    category: "Development",
    level: "Intermediate",
    art: "typescript",
    summary: "Write clearer code. Make fewer guesses.",
    description:
      "Turn a small JavaScript task manager into a confident TypeScript codebase. Learn to describe data, narrow possibilities, and build types that make everyday development easier.",
    instructor: {
      name: "Daniel Brooks",
      initials: "DB",
      role: "Software engineer & TypeScript enthusiast",
    },
    duration: "2h 46m",
    completed: 0,
    current: 0,
    students: "742",
    project:
      "A typed task manager with safe data models and a reusable API client.",
    outcomes: [
      "Describe real data with useful types",
      "Narrow unions and handle every case",
      "Build reusable generic utilities",
      "Type a complete application from end to end",
    ],
    filename: "task.ts",
    code: [
      "type TaskStatus = 'todo' | 'doing' | 'done';",
      "",
      "interface Task {",
      "  id: string;",
      "  title: string;",
      "  status: TaskStatus;",
      "  dueDate?: Date;",
      "}",
      "",
      "export function updateTask<T extends Task>(",
      "  task: T,",
      "  changes: Partial<T>",
      ") : T {",
      "  return { ...task, ...changes };",
      "}",
      "",
      "const next = updateTask(task, { status: 'done' });",
    ],
    sections: [
      {
        title: "A clearer foundation",
        lessons: [
          [
            "Why types are useful",
            "07:30",
            "Discover how types make a codebase easier to read and change.",
          ],
          [
            "Setting up TypeScript",
            "10:12",
            "Configure TypeScript for a small application and read compiler feedback.",
          ],
          [
            "Everyday types",
            "14:18",
            "Describe strings, numbers, arrays, and optional values in real code.",
          ],
          [
            "Objects and interfaces",
            "17:05",
            "Build a clear data model for tasks and their owners.",
          ],
        ],
      },
      {
        title: "Working with possibilities",
        lessons: [
          [
            "Unions and narrowing",
            "19:20",
            "Represent task states as a union and narrow them safely.",
          ],
          [
            "Typing functions",
            "15:10",
            "Make a function's inputs and outputs explicit without unnecessary annotations.",
          ],
          [
            "Generics that make sense",
            "18:45",
            "Keep reusable helpers flexible while preserving useful type information.",
          ],
          [
            "Utility types in context",
            "13:22",
            "Use Partial, Pick, and Omit to describe task updates and summaries.",
          ],
        ],
      },
      {
        title: "Types in a real project",
        lessons: [
          [
            "A typed API client",
            "17:30",
            "Describe request results and handle successful and failed responses clearly.",
          ],
          [
            "Safer UI state",
            "12:18",
            "Model loading, ready, and error states so the UI handles each possibility.",
          ],
          [
            "Refactoring with confidence",
            "11:40",
            "Use compiler feedback to make a safe change across the application.",
          ],
          [
            "Your TypeScript toolkit",
            "08:50",
            "Review the patterns you can take into your next TypeScript project.",
          ],
        ],
      },
    ],
  },
  {
    slug: "interface-design-essentials",
    title: "Interface design essentials",
    shortTitle: "Interface design",
    category: "Design",
    level: "Beginner",
    art: "design",
    summary: "Make interfaces that feel as good as they look.",
    description:
      "Develop an eye for hierarchy, space, and detail. Design a small learning app while turning a loose visual direction into a consistent set of screens and components.",
    instructor: {
      name: "Sofia Rivera",
      initials: "SR",
      role: "Product designer & creative director",
    },
    duration: "3h 04m",
    completed: 4,
    current: 4,
    students: "1,106",
    project:
      "A learning app with a course library, lesson screen, and component system.",
    outcomes: [
      "Create clear visual hierarchy",
      "Choose type, spacing, and color with intention",
      "Design useful, accessible components",
      "Turn a design system into complete screens",
    ],
    filename: "learning-space.fig",
    code: [],
    sections: [
      {
        title: "Learning to see",
        lessons: [
          [
            "What makes an interface work",
            "08:16",
            "Read an interface through its purpose, hierarchy, and clarity.",
          ],
          [
            "Hierarchy and attention",
            "15:20",
            "Guide attention toward the most useful information and actions.",
          ],
          [
            "Working with space",
            "16:45",
            "Use a consistent spacing rhythm to give content room to breathe.",
          ],
          [
            "A thoughtful type scale",
            "19:04",
            "Choose a type scale that supports titles, reading, and small interface labels.",
          ],
        ],
      },
      {
        title: "Building a visual language",
        lessons: [
          [
            "Color with intention",
            "22:12",
            "Create a small semantic palette with accessible contrast and clear roles.",
          ],
          [
            "Grids and alignment",
            "17:08",
            "Build a flexible grid that keeps screens aligned at different sizes.",
          ],
          [
            "Components and states",
            "20:14",
            "Design buttons, inputs, and cards with consistent interaction states.",
          ],
          [
            "A small design system",
            "18:30",
            "Bring typography, colors, spacing, and components into one shared system.",
          ],
        ],
      },
      {
        title: "From pieces to pages",
        lessons: [
          [
            "Designing a course library",
            "17:18",
            "Make a course collection easy to scan and compare.",
          ],
          [
            "A focused lesson experience",
            "16:24",
            "Balance a lesson's content, navigation, and progress without distraction.",
          ],
          [
            "Adapting for smaller screens",
            "13:09",
            "Reconsider content order and navigation for a comfortable mobile experience.",
          ],
          [
            "The final design review",
            "10:40",
            "Review your screens for clarity, consistency, and accessible interaction.",
          ],
        ],
      },
    ],
  },
  {
    slug: "nodejs-and-apis",
    title: "Node.js & API foundations",
    shortTitle: "Node.js & APIs",
    category: "Development",
    level: "Intermediate",
    art: "node",
    summary: "Build the backend behind a great experience.",
    description:
      "Build a small, well-structured API for a bookmark collection. Follow a request from start to finish, work with data, and create responses that are useful to the people building your frontend.",
    instructor: {
      name: "James Okafor",
      initials: "JO",
      role: "Backend engineer & developer advocate",
    },
    duration: "3h 42m",
    completed: 0,
    current: 0,
    students: "658",
    project:
      "A bookmark API with validation, pagination, and a clean data layer.",
    outcomes: [
      "Understand the request-response lifecycle",
      "Build and organize API endpoints",
      "Validate data and handle errors clearly",
      "Document and test a complete API",
    ],
    filename: "bookmarks.ts",
    code: [
      "import { Router } from 'express';",
      "import { bookmarks } from './database';",
      "",
      "export const router = Router();",
      "",
      "router.get('/bookmarks', async (req, res) => {",
      "  const page = Number(req.query.page) || 1;",
      "  const limit = 12;",
      "",
      "  const items = await bookmarks.findMany({",
      "    offset: (page - 1) * limit,",
      "    limit,",
      "  });",
      "",
      "  res.json({ data: items, page });",
      "});",
    ],
    sections: [
      {
        title: "Behind the interface",
        lessons: [
          [
            "How a backend fits together",
            "09:14",
            "Trace the path from a frontend request to a useful API response.",
          ],
          [
            "Your Node.js environment",
            "13:22",
            "Set up a Node.js project with a clear development workflow.",
          ],
          [
            "HTTP without the mystery",
            "18:45",
            "Understand methods, status codes, headers, and request bodies.",
          ],
          [
            "Your first endpoint",
            "20:10",
            "Create a simple endpoint that returns a collection of bookmarks.",
          ],
        ],
      },
      {
        title: "An API worth using",
        lessons: [
          [
            "Routes and middleware",
            "22:18",
            "Organize endpoints and share request handling through middleware.",
          ],
          [
            "Working with a database",
            "25:12",
            "Store bookmarks and isolate database access in a focused data layer.",
          ],
          [
            "Validating request data",
            "19:34",
            "Check incoming data and return clear, actionable validation messages.",
          ],
          [
            "Errors and useful responses",
            "21:16",
            "Handle expected and unexpected errors with consistent response formats.",
          ],
        ],
      },
      {
        title: "Ready for the real world",
        lessons: [
          [
            "Pagination and filtering",
            "23:04",
            "Let clients request manageable pages and filter bookmarks by topic.",
          ],
          [
            "Protecting your endpoints",
            "20:48",
            "Apply authentication checks and sensible limits to sensitive endpoints.",
          ],
          [
            "Testing your API",
            "17:30",
            "Verify endpoint behavior with meaningful request and response tests.",
          ],
          [
            "Documenting and deploying",
            "10:47",
            "Write a useful API reference and prepare the service for deployment.",
          ],
        ],
      },
    ],
  },
  {
    slug: "creative-coding-and-motion",
    title: "Creative coding & motion",
    shortTitle: "Creative motion",
    category: "Creative",
    level: "Beginner",
    art: "motion",
    summary: "Turn a little code into something unexpected.",
    description:
      "Explore the expressive side of the web. Start with simple shapes, discover rhythm and movement, and create a small interactive canvas that responds to the person using it.",
    instructor: {
      name: "Emma Laurent",
      initials: "EL",
      role: "Creative developer & motion designer",
    },
    duration: "2h 58m",
    completed: 12,
    current: 11,
    students: "824",
    project:
      "An interactive particle canvas with expressive motion and pointer response.",
    outcomes: [
      "Draw and compose with the canvas",
      "Shape motion with timing and easing",
      "Create responsive generative patterns",
      "Build an accessible interactive sketch",
    ],
    filename: "particles.ts",
    code: [
      "const particles = createParticles(120);",
      "const pointer = { x: 0, y: 0 };",
      "",
      "function draw(time: number) {",
      "  context.clearRect(0, 0, width, height);",
      "",
      "  particles.forEach((particle, index) => {",
      "    const phase = time * 0.001 + index;",
      "    const x = particle.x + Math.sin(phase) * 24;",
      "    const y = particle.y + Math.cos(phase) * 24;",
      "",
      "    context.beginPath();",
      "    context.arc(x, y, 2, 0, Math.PI * 2);",
      "    context.fill();",
      "  });",
      "  requestAnimationFrame(draw);",
      "}",
    ],
    sections: [
      {
        title: "A canvas for your ideas",
        lessons: [
          [
            "Code as a creative medium",
            "08:42",
            "Explore how a few simple rules can produce expressive visual results.",
          ],
          [
            "Setting up your canvas",
            "12:24",
            "Create a sharp, responsive canvas and a comfortable sketching workflow.",
          ],
          [
            "Shapes and composition",
            "15:36",
            "Draw basic shapes and compose them with balance and intention.",
          ],
          [
            "Color, repetition, and rhythm",
            "17:58",
            "Use a limited palette and repeated forms to give a sketch visual rhythm.",
          ],
        ],
      },
      {
        title: "Making things move",
        lessons: [
          [
            "Your first animation loop",
            "20:15",
            "Create a frame loop and make movement consistent across frame rates.",
          ],
          [
            "Timing and easing",
            "18:42",
            "Compare easing curves and choose timing that feels natural.",
          ],
          [
            "Working with particles",
            "22:06",
            "Build a particle system from small objects with shared behavior.",
          ],
          [
            "Generative patterns",
            "16:34",
            "Combine randomness and a few constraints to create evolving patterns.",
          ],
        ],
      },
      {
        title: "An interactive sketch",
        lessons: [
          [
            "Responding to the pointer",
            "17:28",
            "Let pointer movement influence your sketch with a gentle response.",
          ],
          [
            "A little physics",
            "13:12",
            "Add velocity and friction to make particles move with character.",
          ],
          [
            "Motion with consideration",
            "09:48",
            "Respect reduced-motion preferences and keep interactions comfortable.",
          ],
          [
            "Sharing your creative work",
            "05:15",
            "Polish the final sketch and prepare it for your portfolio.",
          ],
        ],
      },
    ],
  },
];

export const sampleCourses: SampleCourse[] = seeds.map((course, index) => {
  let number = 0;
  return {
    ...course,
    thumbnail: thumbnailSources.thumbnails[index].src,
    sections: course.sections.map((section) => ({
      title: section.title,
      lessons: section.lessons.map(([title, duration, goal]) => ({
        id: title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        title,
        duration,
        goal,
        section: section.title,
        number: ++number,
      })),
    })),
  };
});

export function findSampleCourse(slug: string) {
  return sampleCourses.find((course) => course.slug === slug);
}

export function courseLessons(course: SampleCourse) {
  return course.sections.flatMap((section) => section.lessons);
}

export function currentLesson(course: SampleCourse) {
  return courseLessons(course)[course.current];
}

export function lessonHref(
  course: SampleCourse,
  lesson = currentLesson(course),
) {
  return `/learn/${course.slug}/${lesson.id}`;
}

export function sampleProgress(course: SampleCourse) {
  return Math.round((course.completed / courseLessons(course).length) * 100);
}
