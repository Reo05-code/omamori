import { COMMON } from '@/constants/ui-messages';

type Size = 'sm' | 'md' | 'lg' | number;

type Props = {
  size?: Size;
  className?: string;
  label?: string;
};

export default function Spinner({
  size = 'md',
  className = '',
  label = COMMON.STATUS.LOADING,
}: Props) {
  const isNumber = typeof size === 'number';
  const sizeStyle = isNumber ? { width: size, height: size } : undefined;

  const sizeClass = !isNumber
    ? size === 'sm'
      ? 'h-4 w-4'
      : size === 'lg'
        ? 'h-10 w-10'
        : 'h-6 w-6'
    : '';

  const baseClass = `${sizeClass} animate-spin text-primary-600`;

  return (
    <div role="status" className={`inline-block ${className}`}>
      <svg
        aria-hidden="true"
        style={sizeStyle}
        className={`${baseClass} ${className}`}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}
