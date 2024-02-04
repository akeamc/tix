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
        "px-2 py-1 border font-medium rounded text-xs flex gap-2 items-center shadow-sm hover:bg-gray-100 active:shadow-none active:bg-gray-200 [&>svg]:size-4",
        { "text-gray-500": disabled },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
