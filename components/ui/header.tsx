/**
 * Dashboard Header Component
 * 
 * Header with logo, app title, and separate controls:
 * - User info dropdown
 * - Language switcher dropdown
 * - Logout button
 */

"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserIcon, GlobeIcon, LogOutIcon, ChevronDownIcon } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/hooks/use-i18n"
import { Loading } from "@/components/ui"
import { cn } from "@/lib/utils"
import Logo from "@/components/logo"

export function DashboardHeader() {
	const router = useRouter()
	const { user, logout, logoutLoading } = useAuth()
	const { t, locale, setLocale } = useI18n()
	const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
	const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false)
	const userDropdownRef = useRef<HTMLDivElement>(null)
	const languageDropdownRef = useRef<HTMLDivElement>(null)

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
				setIsUserDropdownOpen(false)
			}
			if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
				setIsLanguageDropdownOpen(false)
			}
		}

		if (isUserDropdownOpen || isLanguageDropdownOpen) {
			document.addEventListener("mousedown", handleClickOutside)
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [isUserDropdownOpen, isLanguageDropdownOpen])

	const handleLogout = async () => {
		try {
			await logout()
			router.push("/")
		} catch (err) {
			console.error("Logout error:", err)
			router.push("/")
		}
	}

	const handleLanguageChange = (newLocale: string) => {
		setLocale(newLocale)
		setIsLanguageDropdownOpen(false)
	}

	if (!user) return null

	return (
		<div className="flex items-center justify-between mb-8">
			{/* Logo and App Title */}
			<div className="flex items-center gap-3">
				<Logo className="w-8 h-8" />
				<h1 className="text-2xl font-bold">{t("pages.home.title")}</h1>
			</div>

			{/* Right Side Controls */}
			<div className="flex items-center gap-2">
				{/* User Info Dropdown */}
				<div className="relative" ref={userDropdownRef}>
					<button
						type="button"
						onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
						className="cursor-pointer flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
						aria-label={t("pages.dashboard.accountMenu")}
						aria-expanded={isUserDropdownOpen}
					>
						<UserIcon className="w-4 h-4" />
					</button>

					{/* User Dropdown Menu */}
					{isUserDropdownOpen && (
						<div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-input bg-popover shadow-lg z-50">
							<div className="p-4">
								<h3 className="text-sm font-semibold mb-3">{t("pages.dashboard.accountInformation")}</h3>
								<dl className="space-y-2">
									<div>
										<dt className="text-xs font-medium text-muted-foreground">{t("pages.dashboard.name")}</dt>
										<dd className="text-sm">{user.name}</dd>
									</div>
									{user.email && (
										<div>
											<dt className="text-xs font-medium text-muted-foreground">{t("pages.dashboard.email")}</dt>
											<dd className="text-sm">{user.email}</dd>
										</div>
									)}
									<div>
										<dt className="text-xs font-medium text-muted-foreground">{t("pages.dashboard.userId")}</dt>
										<dd className="text-xs font-mono">{user.id}</dd>
									</div>
								</dl>
							</div>
						</div>
					)}
				</div>

				{/* Language Switcher Dropdown */}
				<div className="relative" ref={languageDropdownRef}>
					<button
						type="button"
						onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
						className="cursor-pointer flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
						aria-label={t("pages.dashboard.language")}
						aria-expanded={isLanguageDropdownOpen}
					>
						<GlobeIcon className="w-4 h-4" />
					</button>

					{/* Language Dropdown Menu */}
					{isLanguageDropdownOpen && (
						<div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-input bg-popover shadow-lg z-50">
							<div className="p-2">
								<div className="text-xs font-medium text-muted-foreground mb-2 px-2">
									{t("pages.dashboard.language")}
								</div>
								<div className="flex flex-col gap-1">
									<button
										type="button"
										onClick={() => handleLanguageChange("it")}
										className={cn(
											"w-full px-3 py-2 text-sm rounded-md transition-colors text-left flex items-center gap-2",
											locale === "it"
												? "bg-primary text-primary-foreground"
												: "hover:bg-accent hover:text-accent-foreground"
										)}
									>
										<GlobeIcon className="w-3 h-3" />
										{t("pages.dashboard.languages.italian")}
									</button>
									<button
										type="button"
										onClick={() => handleLanguageChange("en")}
										className={cn(
											"w-full px-3 py-2 text-sm rounded-md transition-colors text-left flex items-center gap-2",
											locale === "en"
												? "bg-primary text-primary-foreground"
												: "hover:bg-accent hover:text-accent-foreground"
										)}
									>
										<GlobeIcon className="w-3 h-3" />
										{t("pages.dashboard.languages.english")}
									</button>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Logout Button */}
				<button
					type="button"
					onClick={handleLogout}
					disabled={logoutLoading}
					className="cursor-pointer flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{logoutLoading ? (
						<>
							<Loading size="sm" />
							<span className="text-sm">{t("auth.logout.loggingOut")}</span>
						</>
					) : (
						<>
							<LogOutIcon className="w-4 h-4" />
							<span className="text-sm">{t("navigation.logout")}</span>
						</>
					)}
				</button>
			</div>
		</div>
	)
}
