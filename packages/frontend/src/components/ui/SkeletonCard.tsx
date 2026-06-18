export default function SkeletonCard() {
  return (
    <div class="animate-pulse">
      <div class="aspect-[4/5] rounded-lg bg-surface-container mb-stack-sm" />
      <div class="space-y-2">
        <div class="h-3 w-1/3 rounded bg-surface-container" />
        <div class="h-4 w-2/3 rounded bg-surface-container" />
        <div class="h-4 w-1/4 rounded bg-surface-container" />
      </div>
    </div>
  )
}
