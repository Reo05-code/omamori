export default function OmamoriBagIcon() {
	return (
		<svg
			aria-hidden="true"
			className="h-16 w-16"
			viewBox="0 0 64 80"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				{/* グラデーション定義 */}
				<linearGradient id="bagGrad" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" style={{ stopColor: '#1E3A8A', stopOpacity: 1 }} />
					<stop offset="100%" style={{ stopColor: '#1E40AF', stopOpacity: 1 }} />
				</linearGradient>
				<linearGradient id="cordGrad" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" style={{ stopColor: '#FACC15', stopOpacity: 1 }} />
					<stop offset="100%" style={{ stopColor: '#EAB308', stopOpacity: 1 }} />
				</linearGradient>
			</defs>

			{/* 上部の組紐ループ */}
			<path
				d="M32 4 C32 4, 30 2, 28 3 C26 4, 24 6, 26 8 C28 10, 30 10, 32 9 C34 8, 36 8, 38 9 C40 10, 42 10, 44 8 C46 6, 44 4, 42 3 C40 2, 38 4, 38 4"
				fill="none"
				stroke="url(#cordGrad)"
				strokeWidth="3"
				strokeLinecap="round"
			/>
			<path
				d="M32 8 L32 16 M38 8 L38 16"
				stroke="url(#cordGrad)"
				strokeWidth="2.5"
			/>

			{/* お守り袋本体 */}
			<path
				d="M16 20 C16 16, 20 12, 32 12 C44 12, 48 16, 48 20 L48 60 C48 62, 46 64, 44 64 L20 64 C18 64, 16 62, 16 60 Z"
				fill="url(#bagGrad)"
				stroke="#FACC15"
				strokeWidth="2"
			/>

			{/* 桜のデザイン */}
			<g fill="#FACC15">
				<path d="M32 36 C34 34, 36 34, 38 36 C40 38, 40 40, 38 42 C36 44, 34 44, 32 42 C30 40, 30 38, 32 36 Z" />
				<circle cx="32" cy="36" r="2" />
				<path d="M30 38 L28 40 L30 42 L32 40 Z" />
				<path d="M34 38 L36 40 L34 42 L32 40 Z" />
			</g>
		</svg>
	)
}
