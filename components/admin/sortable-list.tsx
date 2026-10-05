"use client";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
function Item({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-2 border rounded-lg bg-card p-3"
    >
      <button
        type="button"
        aria-label="Reorder item"
        className="touch-none p-1 text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      {children}
    </div>
  );
}
export function SortableList({
  items,
  onReorder,
  render,
}: {
  items: { id: string }[];
  onReorder: (ids: string[]) => void;
  render: (id: string) => React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) {
          const ids = items.map((i) => i.id);
          onReorder(
            arrayMove(
              ids,
              ids.indexOf(String(active.id)),
              ids.indexOf(String(over.id)),
            ),
          );
        }
      }}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item) => (
            <Item key={item.id} id={item.id}>
              {render(item.id)}
            </Item>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
