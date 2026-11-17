import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const decorative = { 'aria-hidden': true, focusable: 'false' } as const;

export function CloudUploadIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 58 39" fill="currentColor" {...decorative} {...props}>
      <path
        fillRule="evenodd"
        d="M46.763 14.722C45.119 6.313 37.797 0 29 0C22.016 0 15.95 3.997 12.929 9.847C5.655 10.627 0 16.843 0 24.375C0 32.443 6.501 39 14.5 39L45.917 39C52.587 39 58 33.54 58 26.813C58 20.378 53.046 15.161 46.763 14.722ZM45.917 34.125L14.5 34.125C9.159 34.125 4.833 29.762 4.833 24.375C4.833 19.378 8.531 15.21 13.437 14.698L16.023 14.43L17.231 12.114C19.527 7.654 24.022 4.875 29 4.875C35.332 4.875 40.793 9.409 42.026 15.673L42.751 19.329L46.448 19.597C50.218 19.841 53.167 23.034 53.167 26.813C53.167 30.834 49.904 34.125 45.917 34.125ZM19.333 21.938L25.496 21.938L25.496 29.25L32.504 29.25L32.504 21.938L38.667 21.938L29 12.188L19.333 21.938Z"
      />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 10 7.059" fill="currentColor" {...decorative} {...props}>
      <path d="M8.494 0.258C8.838 -0.086 9.397 -0.086 9.742 0.258C10.086 0.603 10.086 1.162 9.742 1.506L4.447 6.8C4.103 7.145 3.544 7.145 3.2 6.8L0.258 3.859C-0.086 3.515 -0.086 2.956 0.258 2.611C0.603 2.267 1.162 2.267 1.506 2.611L3.824 4.929L8.494 0.258Z" />
    </svg>
  );
}

export function FileIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 28 28" fill="none" {...decorative} {...props}>
      <path
        d="M7 3.5h9.586a2 2 0 0 1 1.414.586l4.914 4.914A2 2 0 0 1 23.5 10.414V22.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-17a2 2 0 0 1 2-2Z"
        fill="currentColor"
        fillOpacity=".12"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M16.5 3.75V8.5a1.5 1.5 0 0 0 1.5 1.5h5.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.5 15h9M9.5 19h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...decorative} {...props}>
      <path d="m4 4 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SuccessIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...decorative} {...props}>
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path d="m6.25 10.25 2.5 2.5 5-5.25" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...decorative} {...props}>
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path d="M10 9v5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="6.25" r="1.1" fill="#fff" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...decorative} {...props}>
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path d="M10 5.75v5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="13.9" r="1.1" fill="#fff" />
    </svg>
  );
}
