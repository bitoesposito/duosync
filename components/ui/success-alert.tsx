/**
 * Success Alert Component
 * 
 * Reusable success message component
 */

interface SuccessAlertProps {
	message: string
	onDismiss?: () => void
	className?: string
}

export function SuccessAlert({ message, onDismiss, className = "" }: SuccessAlertProps) {
	return (
		<div
			className={`rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-4 py-3 text-sm flex items-start gap-2 ${className}`}
			role="alert"
		>
			<svg
				className="w-5 h-5 flex-shrink-0 mt-0.5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<div className="flex-1">{message}</div>
			{onDismiss && (
				<button
					onClick={onDismiss}
					className="flex-shrink-0 text-green-600/70 dark:text-green-400/70 hover:text-green-600 dark:hover:text-green-400"
					aria-label="Dismiss message"
				>
					<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			)}
		</div>
	)
}
