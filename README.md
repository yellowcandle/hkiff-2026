# HKIFF 2026 選片及排片小幫手

大家每年睇電影節，最大嘅問題係有咁多套戲，揀完邊套睇之後又要排 schedule。因為有時唔同場次會撞時間，或者我哋想就影人出席嘅場次去睇。
一般嚟講，最原始當然係揸住本訂票手冊去圈，但圈完之後，我有幾年都唔覺意圈漏咗，或者買多咗飛，甚至買完飛先發覺撞時間，又要搵人接收張飛。
點樣解決呢個問題？舊年開始已經有朋友寫類似嘅網站，今年當係一個練習，我自己都寫咗一個。

## 功能

- 瀏覽完整片目，支援中英雙語
- 揀選唔同嘅放映場次，加入個人片單
- 對住每日嘅 schedule 睇返自己揀咗啲乜嘢
- Share card 功能 — 生成靚靚嘅分享圖
- Export 日曆檔（.ics），直接加入 Google Calendar / Apple Calendar
- 攞住 Screening Code（放映場次編號），去城市電腦售票網嘅「大量購票」直接買飛

## Tech Stack

- [Next.js](https://nextjs.org/) 15 + React 19
- [Tailwind CSS](https://tailwindcss.com/) v4
- [next-intl](https://next-intl.dev/) 做中英雙語
- Static export，deploy 去 [Cloudflare Pages](https://pages.cloudflare.com/)
- 開發過程用咗 [Claude Code](https://claude.ai/code) + [OpenSpec](https://openspec.dev/) + [Pencil](https://pencil.dev/)
