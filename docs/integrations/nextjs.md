# Next.js Integration Guide

u-widgets는 Lit 기반 Web Components 라이브러리로, 브라우저 환경에서만 동작합니다.
Next.js App Router(RSC)와 통합하려면 클라이언트 전용 컴포넌트로 분리해야 합니다.

## 기본 패턴: `"use client"` 래퍼

**`components/UWidgetClient.tsx`** (클라이언트 컴포넌트):

```tsx
"use client";

import { useRef, useEffect } from "react";
import type { UWidgetSpec } from "@iyulab/u-widgets";

// Web Components 등록 (클라이언트 사이드에서만 실행)
import "@iyulab/u-widgets";
// 차트 사용 시:
// import "@iyulab/u-widgets/charts";

interface Props {
  spec: UWidgetSpec;
  onEvent?: (e: CustomEvent) => void;
}

export function UWidgetClient({ spec, onEvent }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      (ref.current as any).spec = spec;
    }
  }, [spec]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onEvent) return;
    el.addEventListener("u-widget-event", onEvent as EventListener);
    return () => el.removeEventListener("u-widget-event", onEvent as EventListener);
  }, [onEvent]);

  return <u-widget ref={ref} />;
}
```

**Server Component에서 사용:**

```tsx
// app/dashboard/page.tsx (Server Component)
import { UWidgetClient } from "@/components/UWidgetClient";

export default async function DashboardPage() {
  const data = await fetchDashboardData();

  return (
    <main>
      <UWidgetClient
        spec={{ widget: "metric", data: { value: data.orders, label: "주문" } }}
        onEvent={(e) => console.log(e.detail)}
      />
    </main>
  );
}
```

## Dynamic Import (SSR 완전 비활성화)

```tsx
"use client";
import dynamic from "next/dynamic";

const UWidgetClient = dynamic(
  () => import("./UWidgetClient").then(m => m.UWidgetClient),
  { ssr: false, loading: () => <div>Loading...</div> }
);
```

## TypeScript 설정

`tsconfig.json`의 `compilerOptions`에 추가:

```json
{
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve"
  }
}
```

## 자주 묻는 질문

**Q: `customElements is not defined` 에러**
A: `import "@iyulab/u-widgets"`를 `"use client"` 컴포넌트 안으로 이동하세요.

**Q: Server Component에서 직접 사용 가능한가요?**
A: 불가합니다. u-widgets는 DOM API를 사용하므로 반드시 Client Component로 래핑해야 합니다.

**Q: Hydration mismatch 경고**
A: `ssr: false` + dynamic import 패턴을 사용하면 서버 렌더링을 건너뛰어 경고가 사라집니다.

**Q: RSC의 서버 데이터 fetch 이점을 유지할 수 있나요?**
A: 예. 데이터 fetch는 Server Component에서 수행하고, 결과 데이터를 `spec` prop으로
Client Component에 전달하는 패턴을 사용하면 됩니다 (위 예시 참조).
