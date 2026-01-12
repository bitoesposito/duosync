/**
 * Error Alert Component
 * 
 * Reusable error message component
 */

interface ErrorAlertProps {
	error: string | null
	onDismiss?: () => void
	className?: string
}

export function ErrorAlert({ error, onDismiss, className = "" }: ErrorAlertProps) {
	if (!error) return null

	return (
		<div
			className={`rounded-lg bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm flex items-start gap-2 ${className}`}
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
					d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<div className="flex-1">{error}</div>
			{onDismiss && (
				<button
					onClick={onDismiss}
					className="flex-shrink-0 text-destructive/70 hover:text-destructive"
					aria-label="Dismiss"
				>
					<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			)}
		</div>
	)
}
