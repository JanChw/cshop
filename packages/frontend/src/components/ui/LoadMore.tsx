import { Show } from 'solid-js'

export default function LoadMore(props: { hasMore: boolean; loading: boolean; onLoadMore: () => void }) {
  return (
    <Show when={props.hasMore}>
      <div class="flex justify-center py-6">
        <Show
          when={!props.loading}
          fallback={
            <span class="material-symbols-outlined animate-spin text-2xl text-on-surface-variant">progress_activity</span>
          }
        >
          <button
            type="button"
            class="px-6 py-2 bg-surface-container-low text-on-surface rounded-lg text-sm font-bold tap-target hover:bg-surface-container transition-colors"
            onClick={props.onLoadMore}
          >
            加载更多
          </button>
        </Show>
      </div>
    </Show>
  )
}
