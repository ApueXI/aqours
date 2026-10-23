import type { ApprovedGuidance, RuleVersion } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { ActionForm } from '../../../components/ActionForm';
import { advisoryKinds, options } from '../../../components/Filters';
import { date, label, ResourceState } from '../../../components/Status';
import { FormDialog } from '../../../components/FormDialog';

export function SettingsGuidance({ admin }: { admin: boolean }) {
  const guidance = useResource<ApprovedGuidance[]>('/staff/settings/guidance');
  const rules = useResource<RuleVersion[]>('/staff/settings/rules');
  const active = rules.data?.find(rule => rule.active);
  const current = guidance.data?.filter(item => !guidance.data?.some(other => other.kind === item.kind && other.version > item.version));
  const historical = guidance.data?.filter(item => !current?.some(latest => latest.id === item.id));
  return <><section><h2>Approved guidance versions</h2><p className="hint">Adding an approved text does not publish an advisory. Earlier versions remain available as history.</p>
    <button onClick={() => void guidance.refresh()}>Refresh guidance</button><ResourceState resource={guidance}>
      {current?.map(item => <article className="entry" key={item.id}><h3>{label(item.kind)} · Current approved version {item.version}</h3><p className="preserve">{item.text}</p><p>Source: {item.source} · {date(item.createdAt)}</p></article>)}
      {!!historical?.length && <details><summary>Earlier approved guidance · {historical.length} versions</summary><section>{historical.map(item => <article className="entry" key={item.id}><h3>{label(item.kind)} · Version {item.version}</h3><p className="preserve">{item.text}</p><p>Source: {item.source} · {date(item.createdAt)}</p></article>)}</section></details>}
      {guidance.data?.length === 0 && <p>No approved guidance. Use supplier support when instructions are uncertain.</p>}
    </ResourceState>{admin && <FormDialog title="Add approved guidance version" triggerLabel="Add approved guidance version" triggerClassName="primary"><ActionForm path="/staff/settings/guidance" submit="Create guidance version" onDone={() => void guidance.refresh()} fields={[
      { name: 'kind', label: 'Guidance type', type: 'select', required: true, options: options(advisoryKinds) },
      { name: 'text', label: 'Approved instructions', type: 'textarea', required: true },
      { name: 'source', label: 'Approved source / reference', required: true },
    ]} preview={body => <><h3>Review approved {label(String(body.kind))}</h3><p className="preserve">{String(body.text)}</p><p>Source: {String(body.source)}</p><p>This creates an immutable guidance version. It does not publish an advisory.</p></>} /></FormDialog>}</section>
    <section><h2>Recommendation rule versions</h2><p className="hint">Official safety guidance takes precedence. Rules offer supported next actions and never submit assistance, reserve liters, or diagnose water safety.</p>
      <button onClick={() => void rules.refresh()}>Refresh rules</button><ResourceState resource={rules}>
        {active && <article className="entry"><h3>Active version {active.version}</h3><p>Callback: {active.contactText}</p><p>Inspection: {active.inspectionText}</p><p>Water support: {active.waterText}</p><p>{date(active.createdAt)}</p></article>}
        {!!rules.data?.some(item => !item.active) && <details><summary>Historical recommendation rules</summary><section>{rules.data?.filter(item => !item.active).map(item => <article className="entry" key={item.id}><h3>Version {item.version}</h3><p>Callback: {item.contactText}</p><p>Inspection: {item.inspectionText}</p><p>Water support: {item.waterText}</p><p>{date(item.createdAt)}</p></article>)}</section></details>}
        {rules.data?.length === 0 && <p>No rule versions.</p>}
      </ResourceState>{admin && <FormDialog title="Create and activate rule version" triggerLabel="Create and activate rule version" triggerClassName="primary"><ActionForm key={active?.id} path="/staff/settings/rules" submit="Activate new rule version" onDone={() => void rules.refresh()} fields={[
        { name: 'contactText', label: 'Callback recommendation explanation', type: 'textarea', value: active?.contactText, required: true },
        { name: 'inspectionText', label: 'Inspection recommendation explanation', type: 'textarea', value: active?.inspectionText, required: true },
        { name: 'waterText', label: 'Water-support recommendation explanation', type: 'textarea', value: active?.waterText, required: true },
      ]} preview={body => <><h3>Review new recommendation rules</h3><p>Callback: {String(body.contactText)}</p><p>Inspection: {String(body.inspectionText)}</p><p>Water support: {String(body.waterText)}</p><p>Confirming activates a new immutable version and retains the previous rules as history.</p></>} /></FormDialog>}
    </section>
  </>;
}
