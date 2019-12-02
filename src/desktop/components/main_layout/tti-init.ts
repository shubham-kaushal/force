function ttiInit() {
  if ("PerformanceLongTaskTiming" in window) {
    const g = ((window as any).__tti = { e: [] }) as any
    g.o = new PerformanceObserver(function(l) {
      g.e = g.e.concat(l.getEntries())
    })
    g.o.observe({ entryTypes: ["longtask"] })
  }
}

ttiInit()
