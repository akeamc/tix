import classNames from "classnames";
import { ButtonHTMLAttributes, DetailedHTMLProps } from "react";

export default function Button({
  children,
  className,
  disabled,
  ...props
}: DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  return (
    <button
      disabled={disabled}
      className={classNames(
        "flex items-center gap-2 rounded border px-2 py-1 text-xs font-medium shadow-sm hover:bg-gray-100 active:bg-gray-200 active:shadow-none [&>svg]:size-4",
        { "text-gray-500": disabled },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
