import type { ApprovedGuidance, RuleVersion } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { ActionForm } from '../../../components/ActionForm';
import { advisoryKinds, options } from '../../../components/Filters';
import { date, label, ResourceState } from '../../../components/Status';

export function SettingsGuidance({ admin }: { admin: boolean }) {
  const guidance = useResource<ApprovedGuidance[]>('/staff/settings/guidance');
  const rules = useResource<RuleVersion[]>('/staff/settings/rules');
  const active = rules.data?.find(rule => rule.active);
  return <><section><h2>Approved guidance versions</h2><p className="hint text-[#475569] text-[13px]">Adding an approved text does not publish an advisory. Earlier versions remain available as history.</p>
    <button onClick={() => void guidance.refresh()}>Refresh guidance</button><ResourceState resource={guidance}>
      {guidance.data?.map(item => <article className="entry [padding:16px_0] [border-bottom:1px_solid_#dbe3e9] [&_p:last-child]:mb-[0] [&_+_.action-form]:mt-[20px]" key={item.id}><h3>{label(item.kind)} · Version {item.version}</h3><p className="preserve whitespace-pre-wrap [overflow-wrap:anywhere]">{item.text}</p><p>Source: {item.source} · {date(item.createdAt)}</p></article>)}
      {guidance.data?.length === 0 && <p>No approved guidance. Use supplier support when instructions are uncertain.</p>}
    </ResourceState>{admin && <details><summary>Add approved guidance version</summary><ActionForm path="/staff/settings/guidance" submit="Create guidance version" onDone={() => void guidance.refresh()} fields={[
      { name: 'kind', label: 'Guidance type', type: 'select', required: true, options: options(advisoryKinds) },
      { name: 'text', label: 'Approved instructions', type: 'textarea', required: true },
      { name: 'source', label: 'Approved source / reference', required: true },
    ]} /></details>}</section>
    <section><h2>Recommendation rule versions</h2><p className="hint text-[#475569] text-[13px]">Official safety guidance takes precedence. Rules offer supported next actions and never submit assistance, reserve liters, or diagnose water safety.</p>
      <button onClick={() => void rules.refresh()}>Refresh rules</button><ResourceState resource={rules}>
        {rules.data?.map(item => <article className="entry [padding:16px_0] [border-bottom:1px_solid_#dbe3e9] [&_p:last-child]:mb-[0] [&_+_.action-form]:mt-[20px]" key={item.id}><h3>Version {item.version} · {item.active ? 'Active' : 'Historical'}</h3><p>Callback: {item.contactText}</p><p>Inspection: {item.inspectionText}</p><p>Water support: {item.waterText}</p><p>{date(item.createdAt)}</p></article>)}
        {rules.data?.length === 0 && <p>No rule versions.</p>}
      </ResourceState>{admin && <details><summary>Create and activate rule version</summary><ActionForm key={active?.id} path="/staff/settings/rules" submit="Activate new rule version" onDone={() => void rules.refresh()} fields={[
        { name: 'contactText', label: 'Callback recommendation explanation', type: 'textarea', value: active?.contactText, required: true },
        { name: 'inspectionText', label: 'Inspection recommendation explanation', type: 'textarea', value: active?.inspectionText, required: true },
        { name: 'waterText', label: 'Water-support recommendation explanation', type: 'textarea', value: active?.waterText, required: true },
      ]} /></details>}
    </section>
  </>;
}
