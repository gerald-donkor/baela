export function RequiredField({
  children,
  publishOnly = false,
}: {
  children: React.ReactNode;
  publishOnly?: boolean;
}) {
  return (
    <span>
      {children}{" "}
      <span aria-hidden="true" className="text-destructive">
        *
      </span>
      {publishOnly ? (
        <span className="text-xs font-normal text-muted-foreground">
          {" "}
          (required to publish)
        </span>
      ) : (
        <span className="sr-only"> (required)</span>
      )}
    </span>
  );
}

export function RequiredFieldsNote() {
  return (
    <p className="text-xs text-muted-foreground">
      <span aria-hidden="true" className="text-destructive">
        *
      </span>{" "}
      Required fields. Publishing requirements are noted.
    </p>
  );
}
