// First written code to make smoothScroll. Works, but didn't scroll on first page load.
// export default function (to, from, savedPosition) {
//   if (savedPosition) {
//     return savedPosition
//   } else if (to.hash) {
//     return  new Promise((resolve, reject) => {
//       console.log('Promise to hash', to.hash)
//       setTimeout(() => {
//         resolve({
//           selector: to.hash,
//           behavior: 'smooth',
//         })
//       }, 100)
//     })
//   } else {
//     return { x: 0, y: 0 }
//   }
// }

// Almost default scrolBehavior from Nuxt but the first visit is used by browser scroll behavior. Added smooth, offset and delay
// Default nuxt function got from https://github.com/nuxt/nuxt.js/blob/cdbea391b36c7bb3e5fc560dc810162f8875a3f2/packages/vue-app/template/utils.js#L118
function getMatchedComponents(route, matches = false, prop = 'components') {
  return Array.prototype.concat.apply(
    [],
    route.matched.map((m, index) => {
      return Object.keys(m[prop]).map(key => {
        matches && matches.push(index)
        return m[prop][key]
      })
    })
  )
}

// Default nuxt function got from https://github.com/nuxt/nuxt.js/blob/cdbea391b36c7bb3e5fc560dc810162f8875a3f2/packages/vue-app/template/utils.js#L635
function setScrollRestoration(newVal) {
  try {
    window.history.scrollRestoration = newVal
  } catch (e) {}
}

// Default nuxt function got from https://github.com/nuxt/nuxt.js/blob/dev/packages/vue-app/template/router.scrollBehavior.js

if (process.client) {
  if ('scrollRestoration' in window.history) {
    setScrollRestoration('manual')

    // reset scrollRestoration to auto when leaving page, allowing page reload
    // and back-navigation from other pages to use the browser to restore the
    // scrolling position.
    window.addEventListener('beforeunload', () => {
      setScrollRestoration('auto')
    })

    // Setting scrollRestoration to manual again when returning to this page.
    window.addEventListener('load', () => {
      setScrollRestoration('manual')
    })
  }
}

function shouldScrollToTop(route) {
  const Pages = getMatchedComponents(route)
  if (Pages.length === 1) {
    const { options = {} } = Pages[0]
    return options.scrollToTop !== false
  }
  return Pages.some(({ options }) => options && options.scrollToTop)
}

export default function (to, from, savedPosition) {
  // If the returned position is falsy or an empty object, will retain current scroll position
  let position = false
  const isRouteChanged = to !== from

  // savedPosition is only available for popstate navigations (back button)
  if (savedPosition) {
    position = savedPosition
  } else if (isRouteChanged && shouldScrollToTop(to)) {
    position = { x: 0, y: 0 }
  }

  const nuxt = window.$nuxt

  if (
    // Initial load (vuejs/vue-router#3199)
    !isRouteChanged ||
    // Route hash changes
    (to.path === from.path && to.hash !== from.hash)
  ) {
    nuxt.$nextTick(() => nuxt.$emit('triggerScroll'))
  }

  return new Promise(resolve => {
    // wait for the out transition to complete (if necessary)
    nuxt.$once('triggerScroll', () => {
      console.log('scroll triggered', to.hash)
      // coords will be used if no selector is provided,
      // or if the selector didn't match any element.
      if (to.hash) {
        let hash = to.hash
        // CSS.escape() is not supported with IE and Edge.
        if (
          typeof window.CSS !== 'undefined' &&
          typeof window.CSS.escape !== 'undefined'
        ) {
          hash = '#' + window.CSS.escape(hash.substr(1))
        }
        try {
          const el = document.querySelector(hash)
          if (el) {
            // scroll to anchor by returning the selector
            // added behavior here
            position = { selector: hash, behavior: 'smooth' }
            // Respect any scroll-margin-top set in CSS when scrolling to anchor
            const y = Number(
              getComputedStyle(el)['scroll-margin-top']?.replace('px', '')
            )
            // Added default offset
            position.offset = y ? { y } : { y: 100 }
          }
        } catch (e) {
          console.warn(
            'Failed to save scroll position. Please add CSS.escape() polyfill (https://github.com/mathiasbynens/CSS.escape).'
          )
        }
      }
      // default resolve
      //   resolve(position)
      // Added scroll with delay
      setTimeout(() => {
        resolve(position)
      }, 100)
    })
  })
}
