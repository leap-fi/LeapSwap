import type { StateCreator } from 'zustand'
import { persist } from 'zustand/middleware'
import { createWithEqualityFn } from 'zustand/traditional'
import type { ToAddress } from '../../types/widget.js'
import type { PersistStoreProps } from '../types.js'
import type { BookmarkState } from './types.js'

const recentWalletsLimit = 10

interface PersistBookmarkProps extends PersistStoreProps {
  toAddress?: ToAddress
}
export const createBookmarksStore = ({
  namePrefix,
  toAddress,
}: PersistBookmarkProps) =>
  createWithEqualityFn<BookmarkState>(
    persist(
      (set, get) => ({
        selectedBookmark: toAddress,
        bookmarks: [],
        recentWallets: [],
        getBookmark: (address: string) =>
          (get() as any).bookmarks.find((bookmark: any) => bookmark.address === address),
        addBookmark: (bookmark: any) => {
          set((state: any) => ({
            bookmarks: [bookmark, ...state.bookmarks],
          }))
        },
        removeBookmark: (address: string) => {
          set((state: any) => ({
            bookmarks: state.bookmarks.filter(
              (storedBookmark: any) => storedBookmark.address !== address
            ),
          }))
        },
        getSelectedBookmark: () => (get() as any).selectedBookmark,
        setSelectedBookmark: (bookmark: any) => {
          set((_state: any) => ({
            selectedBookmark: bookmark,
          }))
        },
        addRecentWallet: (bookmark: any) => {
          set((state: any) => ({
            recentWallets: [
              bookmark,
              ...state.recentWallets.filter(
                (recentWallet: any) => recentWallet.address !== bookmark.address
              ),
            ].slice(0, recentWalletsLimit),
          }))
        },
        removeRecentWallet: (address: string) => {
          set((state: any) => ({
            recentWallets: state.recentWallets.filter(
              (storedRecent: any) => storedRecent.address !== address
            ),
          }))
        },
      }),
      {
        name: `${namePrefix || 'leapswap'}-bookmarks`,
        version: 0,
        partialize: (state) => ({
          bookmarks: (state as any).bookmarks,
          recentWallets: (state as any).recentWallets,
        }),
        onRehydrateStorage: () => {
          return (state) => {
            if (state && toAddress && !toAddress.name) {
              const existingBookmark = (state as any).getBookmark(toAddress.address)
              if (existingBookmark) {
                (state as any).setSelectedBookmark(existingBookmark)
              }
            }
          }
        },
      }
    ) as unknown as StateCreator<BookmarkState, [], [], BookmarkState>,
    Object.is
  )
