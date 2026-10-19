const styles: Record<string, string> = {
  field:
    "flex flex-col gap-[6px] mb-[16px] max-w-[640px] [&_>_span:first-child]:font-[550]",
  "check-field":
    "flex items-center flex-wrap gap-[8px] mb-[16px] [&_>_.hint]:basis-[100%]",
  hint: "text-[#475569] text-[13px]",
  error:
    "[border-left:3px_solid] [padding:10px_12px] [margin:12px_0] text-[#9f1239] bg-[#fff1f2] [border-color:#be123c]",
  notice:
    "[border-left:3px_solid] [padding:10px_12px] [margin:12px_0] text-[#854d0e] bg-[#fffbeb] [border-color:#b45309]",
  success:
    "[border-left:3px_solid] [padding:10px_12px] [margin:12px_0] text-[#115e59] bg-[#f0fdfa] [border-color:#0f766e]",
  "warning-text": "text-[#92400e]",
  preserve: "whitespace-pre-wrap [overflow-wrap:anywhere]",
  "app-shell":
    "grid [grid-template-columns:240px_minmax(0,_1fr)] min-h-[100vh] [@media(max-width:_1100px)]:[grid-template-columns:200px_minmax(0,_1fr)] [@media(max-width:_760px)]:block",
  sidebar:
    "[border-right:1px_solid_#d3dce3] bg-[#fff] [padding:24px_16px] flex flex-col [&_nav]:flex [&_nav]:flex-col [&_nav]:gap-[4px] [&_nav_a]:text-[#334155] [&_nav_a]:no-underline [&_nav_a]:[padding:9px_12px] [&_nav_a]:[border-radius:4px] [&_nav_a:hover]:bg-[#f1f5f9] [&_nav_a[aria-current]]:bg-[#e6f3f0] [&_nav_a[aria-current]]:text-[#115e59] [&_nav_a[aria-current]]:font-[650] [@media(max-width:_760px)]:p-[16px] [@media(max-width:_760px)]:[border-right:0] [@media(max-width:_760px)]:[border-bottom:1px_solid_#d3dce3] [@media(max-width:_760px)]:[&_nav]:flex-row [@media(max-width:_760px)]:[&_nav]:overflow-x-auto [@media(max-width:_760px)]:[&_nav]:gap-[4px] [@media(max-width:_760px)]:[&_nav_a]:[padding:8px_10px] [@media(max-width:_760px)]:[&_nav_a]:whitespace-nowrap",
  brand:
    "text-[#0f172a] text-[24px] font-[700] no-underline [padding:0_12px] [@media(max-width:_760px)]:p-[0] [@media(max-width:_760px)]:text-[22px]",
  "supplier-label":
    "text-[#475569] [padding:0_12px] mt-[4px] mb-[28px] [@media(max-width:_760px)]:p-[0] [@media(max-width:_760px)]:mb-[12px]",
  identity:
    "mt-auto [padding:32px_12px_0] flex flex-col gap-[6px] [&_span]:text-[#475569] [&_button]:mt-[8px] [@media(max-width:_760px)]:[padding:16px_0_0] [@media(max-width:_760px)]:flex-row [@media(max-width:_760px)]:items-center [@media(max-width:_760px)]:gap-[12px] [@media(max-width:_760px)]:flex-wrap [@media(max-width:_760px)]:[&_button]:[margin:0_0_0_auto] [@media(max-width:_760px)]:[&_.error]:basis-[100%]",
  workspace:
    "[padding:28px_32px] max-w-[1560px] w-full [&_>_section]:p-[20px] [&_>_section]:bg-[#fff] [&_>_section]:[border:1px_solid_#d3dce3] [&_>_section]:[border-radius:5px] [&_>_div_>_section]:p-[20px] [&_>_div_>_section]:bg-[#fff] [&_>_div_>_section]:[border:1px_solid_#d3dce3] [&_>_div_>_section]:[border-radius:5px] [@media(min-width:_1600px)]:[margin:0_auto] [@media(max-width:_1100px)]:[padding:24px_20px] [@media(max-width:_760px)]:[padding:24px_16px] [@media(max-width:_760px)]:[&_>_section]:p-[16px] [@media(max-width:_760px)]:[&_>_div_>_section]:p-[16px]",
  "page-title":
    "flex items-center flex-wrap gap-[16px] mb-[24px] [&_h1]:[margin:0_auto_0_0] [@media(max-width:_760px)]:gap-[12px]",
  columns:
    "grid [grid-template-columns:repeat(2,_minmax(0,_1fr))] gap-[24px] [&_>_section]:bg-[#fff] [&_>_section]:[border:1px_solid_#d3dce3] [&_>_section]:[border-radius:5px] [&_>_section]:p-[20px] [@media(max-width:_1100px)]:[grid-template-columns:minmax(0,_1fr)] [@media(max-width:_1100px)]:gap-[0] [@media(max-width:_760px)]:[&_>_section]:p-[16px]",
  filters:
    "flex items-end flex-wrap gap-[12px] p-[16px] mb-[20px] [border:1px_solid_#d3dce3] bg-[#fff] [&_.field]:[flex:1_1_155px] [&_.field]:max-w-[240px] [&_.field]:mb-[0] [&_button]:mb-[1px] [@media(max-width:_760px)]:p-[12px] [@media(max-width:_760px)]:gap-[10px] [@media(max-width:_760px)]:[&_.field]:[flex-basis:calc(50%_-_10px)] [@media(max-width:_760px)]:[&_.field]:max-w-none [@media(max-width:_760px)]:[&_.field]:min-w-[135px]",
  "table-scroll": "w-full overflow-x-auto",
  pagination:
    "flex items-center justify-end flex-wrap gap-[8px] pt-[12px] [&_span]:mr-[auto] [&_span]:text-[#475569]",
  facts:
    "grid [grid-template-columns:minmax(150px,_1fr)_minmax(0,_3fr)] gap-y-[12px] gap-x-[20px] [margin:0_0_20px] [&_dt]:font-[550] [&_dt]:text-[#475569] [&_dd]:m-[0] [&_dd]:[overflow-wrap:anywhere] [@media(max-width:_1100px)]:[grid-template-columns:minmax(120px,_1fr)_minmax(0,_2fr)] [@media(max-width:_760px)]:block [@media(max-width:_760px)]:[&_dt]:mt-[12px] [@media(max-width:_760px)]:[&_dd]:mt-[4px]",
  "fact-pair": "contents",
  "action-form": "mt-[16px] max-w-[720px] [&_fieldset_>_button]:mt-[4px]",
  entry:
    "[padding:16px_0] [border-bottom:1px_solid_#dbe3e9] [&_p:last-child]:mb-[0] [&_+_.action-form]:mt-[20px]",
  preview: "p-[16px] mt-[20px] [border:1px_solid_#0f766e] bg-[#f8fafc]",
  actions: "flex flex-wrap gap-[8px] mt-[20px]",
  history: "m-[0] pl-[20px] [&_li]:[padding:8px_0] [&_p]:[margin:6px_0]",
  attachment:
    "[&_img]:block [&_img]:max-w-full [&_img]:max-h-[420px] [&_img]:[margin:12px_0] [&_img]:object-contain [padding:12px_0]",
  session: "[padding:20px_0] [border-bottom:1px_solid_#d3dce3]",
  lookup: "flex items-end gap-[12px] [&_.field]:flex-[1] [&_.field]:m-[0]",
  tabs: "flex overflow-x-auto gap-[8px] mb-[20px] [border-bottom:1px_solid_#b8c4ce] [&_button]:[border-width:0_0_3px] [&_button]:[border-style:solid] [&_button]:[border-color:transparent] [&_button]:rounded-none [&_button]:bg-[transparent] [&_button]:whitespace-nowrap [&_button[aria-current]]:[border-bottom-color:#0f766e] [&_button[aria-current]]:text-[#115e59] [&_button[aria-current]]:font-[650]",
  map: "h-[480px] [border:1px_solid_#b8c4ce] [margin:16px_0] bg-[#e2e8f0] [@media(max-width:_760px)]:h-[380px]",
  login:
    "[width:min(440px,_calc(100%_-_32px))] [margin:10vh_auto] bg-[#fff] [border:1px_solid_#d3dce3] p-[32px] [border-radius:5px] [&_h1]:text-[22px] [&_form]:mt-[24px] [&_form_button]:w-full [&_form_button]:mb-[20px]",
  "session-loading":
    "[width:min(440px,_calc(100%_-_32px))] [margin:10vh_auto] bg-[#fff] [border:1px_solid_#d3dce3] p-[32px] [border-radius:5px]",
  "login-brand": "text-[24px] font-[700] mb-[24px]",
  "skip-link":
    "absolute left-[12px] top-[-100px] bg-[#fff] p-[12px] z-[10] focus:top-[12px]",
  stock:
    "[@media(max-width:_760px)]:text-[12px] [@media(max-width:_760px)]:[&_th]:[padding:8px_4px] [@media(max-width:_760px)]:[&_td]:[padding:8px_4px]",
};

export function styleClasses(value: string) {
  return value
    .split(/\s+/)
    .map((name) => [name, styles[name]].filter(Boolean).join(" "))
    .join(" ");
}
