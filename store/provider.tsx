/**
 * Redux Provider for Next.js App Router
 * 
 * Wraps the app with Redux store provider using next-redux-wrapper
 */

"use client"

import { useRef } from "react"
import { Provider } from "react-redux"
import { makeStore, AppStore } from "./index"

export default function StoreProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const storeRef = useRef<AppStore>()
	
	if (!storeRef.current) {
		storeRef.current = makeStore()
	}
	
	return <Provider store={storeRef.current}>{children}</Provider>
}
