/** Bolsa (Material Design Icons sack) + $ en blanco — MDI Apache-2.0 */
type Props = { className?: string };

export function SalaryMoneyBagIcon({ className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      focusable={false}
    >
      <path
        fill="currentColor"
        d="M16 9c4 2 5 9 5 9s1 4-5 4H8c-6 0-5-4-5-4s1-7 5-9m6-5l-2-2l-2 2l-4-2l2 5h8l2-5z"
      />
      <text
        x="12"
        y="16.5"
        fill="#ffffff"
        fontSize="10.5"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        $
      </text>
    </svg>
  );
}
