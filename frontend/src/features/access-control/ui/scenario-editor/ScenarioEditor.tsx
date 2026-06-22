'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Copy,
  FileJson2,
  LayoutTemplate,
  Pencil,
  Play,
  Plus,
  RefreshCcw,
  Save,
  Settings2,
  Trash2,
  Wand2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useTranslation, useCurrentUserId } from '@/hooks';
import { useToast } from '@/components/shared';
import { ApiError, scenariosApi } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  createDefaultScenarioDefinitionV1,
  createEmptyScenarioDefinitionV1,
  generateWebhookToken,
  validateScenarioDefinitionV1,
  type ScenarioActionV1,
  type ScenarioConditionV1,
  type ScenarioDefinitionV1,
  type ScenarioScopeKindV1,
  type ScenarioStatus,
  type ScenarioTriggerV1,
} from '@/features/access-control/model/scenario-definition-v1';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScenarioPlannerWidget } from '@/widgets/scenario-planner';
import { useScenarioPlannerStore } from '@/store/scenario-planner-store';
import { definitionToGraph, graphToDefinition } from '@/widgets/scenario-planner/lib/graph-mapper';

type ScenarioDraft = {
  id?: string;
  name: string;
  description: string;
  status: ScenarioStatus;
  spaceId: string;
  definition: ScenarioDefinitionV1;
  advancedJson: boolean;
  jsonText: string;
};

export function ScenarioEditor(props: {
  mode: 'create' | 'edit';
  houseId: string;
  scenarioId?: string;
  returnHref?: string;
  readOnly?: boolean;
  initialScenario?: {
    id: string;
    name: string;
    description?: string | null;
    status: ScenarioStatus;
    houseId?: string | number;
    definition?: ScenarioDefinitionV1;
  };
}) {
  const { mode, houseId, scenarioId, initialScenario, readOnly = false } = props;
  const returnHref =
    props.returnHref ?? `/admin/access-control/houses/${encodeURIComponent(houseId)}`;
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const currentUserId = useCurrentUserId();
  const [viewMode, setViewMode] = useState<'form' | 'graph'>('form');
  const graphNodes = useScenarioPlannerStore((s) => s.nodes);
  const graphEdges = useScenarioPlannerStore((s) => s.edges);
  const setGraph = useScenarioPlannerStore((s) => s.setGraph);

  const [loading, setLoading] = useState(mode === 'edit' && !initialScenario);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [validationIssues, setValidationIssues] = useState<Array<{ path: string; message: string }>>([]);

  const baselineRef = useRef<string>('');
  const [draft, setDraft] = useState<ScenarioDraft>(() => {
    if (mode === 'edit' && initialScenario) {
      const scopeKind: ScenarioScopeKindV1 = initialScenario.definition?.scope?.kind ?? 'HOUSE';
      const spaceId = initialScenario.definition?.scope?.spaceId ?? String(initialScenario.houseId ?? houseId);
      const definition = initialScenario.definition ?? createDefaultScenarioDefinitionV1({ scopeKind, spaceId });
      const d: ScenarioDraft = {
        id: initialScenario.id,
        name: initialScenario.name ?? '',
        description: initialScenario.description ?? '',
        status: initialScenario.status,
        spaceId,
        definition,
        advancedJson: false,
        jsonText: JSON.stringify(definition, null, 2),
      };
      baselineRef.current = JSON.stringify(d);
      return d;
    }

    const spaceId = houseId;
    const scopeKind: ScenarioScopeKindV1 = 'HOUSE';
    const definition = createEmptyScenarioDefinitionV1({ scopeKind, spaceId });
    const d: ScenarioDraft = {
      name: '',
      description: '',
      status: 'OFFLINE',
      spaceId,
      definition,
      advancedJson: false,
      jsonText: JSON.stringify(definition, null, 2),
    };
    baselineRef.current = JSON.stringify(d);
    return d;
  });

  const isDirty = useMemo(() => JSON.stringify(draft) !== baselineRef.current, [draft]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          router.push('/login');
          return;
        }
        if (error.status === 403) {
          showToast(t('errors.unauthorized'), 'error');
          return;
        }
      }
      showToast(t('common.error'), 'error');
    },
    [router, showToast, t]
  );

  const syncDefinitionFromBasic = useCallback((prev: ScenarioDraft) => {
    const nextDef: ScenarioDefinitionV1 = {
      ...prev.definition,
      scope: {
        kind: prev.definition.scope.kind,
        spaceId: prev.spaceId,
      },
    };
    return { ...prev, definition: nextDef, jsonText: JSON.stringify(nextDef, null, 2) };
  }, []);

  const validateDraft = useCallback(
    (d: ScenarioDraft) => {
      const issues: Array<{ path: string; message: string }> = [];
      if (!d.name.trim())
        issues.push({ path: 'name', message: t('admin.accessControl.scenarioEditor.validation.nameRequired') });
      if (d.name.trim().length > 255)
        issues.push({ path: 'name', message: t('admin.accessControl.scenarioEditor.validation.nameMax') });
      if (d.description.length > 2000)
        issues.push({
          path: 'description',
          message: t('admin.accessControl.scenarioEditor.validation.descriptionMax'),
        });
      if (!d.spaceId.trim())
        issues.push({
          path: 'definition.scope.spaceId',
          message: t('admin.accessControl.scenarioEditor.validation.missingSpace'),
        });
      if (d.status === 'ERROR') {
        issues.push({
          path: 'status',
          message: t('admin.accessControl.scenarioEditor.validation.errorStatusReadonly'),
        });
      }

      if (d.advancedJson) {
        try {
          const parsed = JSON.parse(d.jsonText);
          issues.push(...validateScenarioDefinitionV1(parsed));
        } catch {
          issues.push({ path: 'definition', message: t('admin.accessControl.scenarioEditor.validation.invalidJson') });
        }
      } else {
        issues.push(...validateScenarioDefinitionV1(d.definition));
      }

      return issues;
    },
    [t]
  );

  useEffect(() => {
    if (mode !== 'edit' || initialScenario) return;
    if (!scenarioId) return;
    const controller = new AbortController();
    setLoading(true);
    void scenariosApi
      .getById(scenarioId, { signal: controller.signal })
      .then((s: any) => {
        if (controller.signal.aborted) return;
        const def = (s?.definition && typeof s.definition === 'object' && s.definition.version === 1 ? s.definition : undefined) as
          | ScenarioDefinitionV1
          | undefined;
        const scopeKind: ScenarioScopeKindV1 = def?.scope?.kind ?? 'HOUSE';
        const spaceId = def?.scope?.spaceId ?? String(s?.houseId ?? houseId);
        const definition = def ?? createDefaultScenarioDefinitionV1({ scopeKind, spaceId });
        const d: ScenarioDraft = {
          id: String(s?.id ?? scenarioId),
          name: String(s?.name ?? ''),
          description: String(s?.description ?? ''),
          status: (s?.status as ScenarioStatus) ?? 'OFFLINE',
          spaceId,
          definition,
          advancedJson: false,
          jsonText: JSON.stringify(definition, null, 2),
        };
        setDraft(d);
        baselineRef.current = JSON.stringify(d);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        handleError(e);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [handleError, houseId, initialScenario, mode, scenarioId]);

  const onBack = useCallback(() => {
    if (isDirty) {
      const ok = window.confirm(t('admin.accessControl.scenarioEditor.confirm.leaveUnsaved'));
      if (!ok) return;
    }
    router.push(returnHref);
  }, [isDirty, returnHref, router, t]);

  const onValidate = useCallback(() => {
    const issues = validateDraft(draft);
    setValidationIssues(issues);
    if (issues.length === 0) showToast(t('common.success'), 'success');
  }, [draft, showToast, t, validateDraft]);

  const save = useCallback(
    async (opts?: { enableAfterSave?: boolean }) => {
      const issues = validateDraft(draft);
      setValidationIssues(issues);
      if (issues.length > 0) return;

      setSaving(true);
      try {
        const def = draft.advancedJson ? (JSON.parse(draft.jsonText) as ScenarioDefinitionV1) : draft.definition;
        const basePayload = {
          name: draft.name.trim(),
          description: draft.description.trim() ? draft.description.trim() : null,
          status: opts?.enableAfterSave
            ? ('ONLINE' as ScenarioStatus)
            : draft.status === 'ERROR'
              ? ('OFFLINE' as ScenarioStatus)
              : draft.status,
          definition: def,
        };

        if (mode === 'create') {
          await scenariosApi.create({
            ...basePayload,
            houseId: draft.spaceId,
          });
          showToast(t('admin.messages.createSuccess'), 'success');
          baselineRef.current = JSON.stringify(draft);
          router.push(returnHref);
          return;
        }

        if (mode === 'edit' && draft.id) {
          await scenariosApi.update(draft.id, basePayload);
          showToast(t('admin.messages.updateSuccess'), 'success');
          baselineRef.current = JSON.stringify(draft);
          return;
        }
      } catch (e) {
        handleError(e);
      } finally {
        setSaving(false);
      }
    },
    [currentUserId, draft, handleError, mode, returnHref, router, showToast, t, validateDraft]
  );

  const saveFromGraph = useCallback(
    async (opts?: { enableAfterSave?: boolean }) => {
      const nextDef = graphToDefinition({ nodes: graphNodes, edges: graphEdges, base: draft.definition });
      setDraft((prev) => ({
        ...prev,
        definition: nextDef,
        jsonText: JSON.stringify(nextDef, null, 2),
      }));
      await save(opts);
    },
    [draft.definition, graphEdges, graphNodes, save]
  );

  useEffect(() => {
    if (viewMode !== 'graph') return;
    const graph = definitionToGraph(draft.definition, { houseId, locale });
    setGraph(houseId, graph);
  }, [draft.definition, houseId, locale, setGraph, viewMode]);

  const remove = useCallback(async () => {
    if (!draft.id) return;
    const ok = window.confirm(t('admin.accessControl.scenarioEditor.confirm.deleteScenario'));
    if (!ok) return;
    setDeleting(true);
    try {
      await scenariosApi.delete(draft.id);
      showToast(t('admin.messages.deleteSuccess'), 'success');
      router.push(returnHref);
    } catch (e) {
      handleError(e);
    } finally {
      setDeleting(false);
    }
  }, [draft.id, handleError, returnHref, router, showToast, t]);

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <Pencil className="size-4 text-muted-foreground" />
            {mode === 'create'
              ? t('admin.accessControl.scenarioEditor.titleCreate')
              : readOnly
                ? (locale === 'ru' ? 'Просмотр сценария' : 'View scenario')
                : t('admin.accessControl.scenarioEditor.titleEdit')}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={onBack} disabled={saving || deleting}>
            {t('admin.accessControl.scenarioEditor.back')}
          </Button>
          <Button variant="secondary" onClick={onValidate} disabled={saving || deleting || loading}>
            <Zap className="mr-2 size-4" />
            {t('admin.accessControl.scenarioEditor.validate')}
          </Button>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList className="h-10 w-full p-1">
          <TabsTrigger value="form" className="px-4 py-2 text-base data-[state=active]:text-background">
            {t('admin.accessControl.scenarioEditor.tabForm')}
          </TabsTrigger>
          <TabsTrigger value="graph" className="px-4 py-2 text-base data-[state=active]:text-background">
            {t('admin.accessControl.scenarioEditor.tabGraph')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className={readOnly ? 'pointer-events-none opacity-90' : undefined}>
      {validationIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.accessControl.scenarioEditor.errorsTitle')}</CardTitle>
            <CardDescription>
              {t('admin.accessControl.scenarioEditor.errorsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-inside list-disc space-y-1">
              {validationIssues.slice(0, 12).map((i, idx) => (
                <li key={`${i.path}-${idx}`}>
                  <span className="font-mono text-xs">{i.path}</span> — {i.message}
                </li>
              ))}
              {validationIssues.length > 12 && (
                <li>
                  {t('admin.accessControl.scenarioEditor.errorsMore', { count: validationIssues.length - 12 })}
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid flex-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings2 className="size-4 text-muted-foreground" />
                  {t('admin.accessControl.scenarioEditor.basics.title')}
                </CardTitle>
                <Switch
                  checked={draft.status === 'ONLINE'}
                  onCheckedChange={(checked) =>
                    setDraft((p) => ({
                      ...p,
                      status: checked ? ('ONLINE' as ScenarioStatus) : ('OFFLINE' as ScenarioStatus),
                    }))
                  }
                  disabled={draft.status === 'ERROR'}
                  aria-label={t('admin.accessControl.scenarioEditor.basics.toggleAria')}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {mode === 'edit' ? (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="secondary" size="sm">
                      {t('admin.accessControl.scenarioEditor.basics.nameDescriptionButton')}
                      <ChevronDown className="ml-2 size-4 opacity-70" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('admin.accessControl.scenarioEditor.basics.nameLabel')}</label>
                      <Input
                        value={draft.name}
                        aria-invalid={validationIssues.some((i) => i.path === 'name')}
                        onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                        placeholder={t('admin.accessControl.scenarioEditor.basics.namePlaceholder')}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('admin.accessControl.scenarioEditor.basics.descriptionLabel')}</label>
                      <Textarea
                        value={draft.description}
                        aria-invalid={validationIssues.some((i) => i.path === 'description')}
                        onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                        placeholder={t('admin.accessControl.scenarioEditor.basics.descriptionPlaceholder')}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('admin.accessControl.scenarioEditor.basics.nameLabel')}</label>
                    <Input
                      value={draft.name}
                      aria-invalid={validationIssues.some((i) => i.path === 'name')}
                      onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                      placeholder={t('admin.accessControl.scenarioEditor.basics.namePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('admin.accessControl.scenarioEditor.basics.descriptionLabel')}</label>
                    <Textarea
                      value={draft.description}
                      aria-invalid={validationIssues.some((i) => i.path === 'description')}
                      onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                      placeholder={t('admin.accessControl.scenarioEditor.basics.descriptionPlaceholder')}
                    />
                  </div>
                </>
              )}

              <Separator />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const def = createDefaultScenarioDefinitionV1({
                      scopeKind: draft.definition.scope.kind,
                      spaceId: draft.spaceId,
                    });
                    setDraft((p) => ({ ...p, definition: def, jsonText: JSON.stringify(def, null, 2) }));
                  }}
                >
                  <RefreshCcw className="mr-2 size-4" />
                  {t('admin.accessControl.scenarioEditor.reset')}
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    const tpl =
                      draft.definition.scope.kind === 'HOUSE'
                        ? ({
                            version: 1,
                            scope: { kind: 'HOUSE', spaceId: draft.spaceId },
                            triggers: [{ type: 'SCHEDULE', cron: '0 7 * * *', enabled: true }],
                            conditions: { type: 'TIME_WINDOW', from: '06:00', to: '10:00' },
                            actions: [{ type: 'NOTIFY', channel: 'PUSH', message: t('admin.accessControl.scenarioEditor.templateGoodMorning') }],
                            options: { timezone: 'Europe/Moscow' },
                          } as ScenarioDefinitionV1)
                        : ({
                            version: 1,
                            scope: { kind: 'OFFICE', spaceId: draft.spaceId },
                            triggers: [
                              { type: 'DEVICE_EVENT', deviceId: 'motion-sensor-1', event: 'MOTION', enabled: true },
                            ],
                            conditions: { type: 'ALWAYS' },
                            actions: [{ type: 'DEVICE_COMMAND', deviceId: 'light-1', command: 'TURN_ON' }],
                            options: { debounceMs: 500, maxConcurrency: 5 },
                          } as ScenarioDefinitionV1);
                    setDraft((p) => ({ ...p, definition: tpl, jsonText: JSON.stringify(tpl, null, 2) }));
                  }}
                >
                  <LayoutTemplate className="mr-2 size-4" />
                  {t('admin.accessControl.scenarioEditor.useTemplate')}
                </Button>
              </div>

              <Collapsible
                open={draft.advancedJson}
                onOpenChange={(open) =>
                  setDraft((p) => ({
                    ...p,
                    advancedJson: open,
                    jsonText: JSON.stringify(p.definition, null, 2),
                  }))
                }
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="px-0">
                    <FileJson2 className="mr-2 size-4" />
                    {t('admin.accessControl.scenarioEditor.advancedMode')}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2 rounded-md border border-border bg-muted/30 p-3">
                  <div className="text-sm font-medium">
                    {t('admin.accessControl.scenarioEditor.carefulTitle')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.accessControl.scenarioEditor.carefulDescription')}
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wand2 className="size-4 text-muted-foreground" />
                {t('admin.accessControl.scenarioEditor.stepsTitle')}
              </CardTitle>
              <CardDescription>
                {t('admin.accessControl.scenarioEditor.stepsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!draft.advancedJson ? (
                <ScenarioBuilder
                  value={draft.definition}
                  onChange={(next) => setDraft((p) => ({ ...p, definition: next, jsonText: JSON.stringify(next, null, 2) }))}
                />
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('admin.accessControl.scenarioEditor.definitionJson')}</label>
                  <Textarea
                    className="min-h-[360px] font-mono text-xs"
                    value={draft.jsonText}
                    onChange={(e) => setDraft((p) => ({ ...p, jsonText: e.target.value }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-1 border-t border-border bg-background/80 px-1 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {loading
              ? t('admin.accessControl.scenarioEditor.loading')
              : isDirty
                ? t('admin.accessControl.scenarioEditor.unsavedChanges')
                : t('admin.accessControl.scenarioEditor.allSaved')}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!readOnly && mode === 'edit' && (
              <Button variant="destructive" disabled={deleting || saving || loading} onClick={remove}>
                <Trash2 className="mr-2 size-4" />
                {deleting ? t('admin.accessControl.scenarioEditor.deleting') : t('admin.accessControl.scenarioEditor.delete')}
              </Button>
            )}
            <Button variant="secondary" disabled={saving || deleting || loading} onClick={onBack}>
              {readOnly ? t('admin.accessControl.scenarioEditor.back') : t('common.cancel')}
            </Button>
            {!readOnly && (
              <>
                <Button disabled={saving || deleting || loading} onClick={() => save()}>
                  <Save className="mr-2 size-4" />
                  {saving ? t('admin.accessControl.scenarioEditor.saving') : t('common.save')}
                </Button>
                {mode === 'create' && (
                  <Button disabled={saving || deleting || loading} onClick={() => save({ enableAfterSave: true })}>
                    <Play className="mr-2 size-4" />
                    {t('admin.accessControl.scenarioEditor.saveAndEnable')}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="graph">
          {!readOnly && (
            <div className="flex items-center justify-end gap-2 pb-2">
              <Button variant="secondary" disabled={saving || deleting || loading} onClick={() => saveFromGraph()}>
                <Save className="mr-2 size-4" />
                {t('common.save')}
              </Button>
              {mode === 'create' && (
                <Button disabled={saving || deleting || loading} onClick={() => saveFromGraph({ enableAfterSave: true })}>
                  <Play className="mr-2 size-4" />
                  {t('admin.accessControl.scenarioEditor.saveAndEnable')}
                </Button>
              )}
            </div>
          )}
          <div className={readOnly ? 'pointer-events-none opacity-90 h-[calc(100vh-16rem)]' : 'h-[calc(100vh-16rem)]'}>
            <ScenarioPlannerWidget houseId={houseId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScenarioBuilder(props: {
  value: ScenarioDefinitionV1;
  onChange: (next: ScenarioDefinitionV1) => void;
}) {
  const { value, onChange } = props;
  const { t } = useTranslation();

  const setTriggers = (next: ScenarioTriggerV1[]) => onChange({ ...value, triggers: next });
  const setActions = (next: ScenarioActionV1[]) => onChange({ ...value, actions: next });
  const setConditions = (next: ScenarioConditionV1 | undefined) => onChange({ ...value, conditions: next });
  const setOptions = (patch: Partial<NonNullable<ScenarioDefinitionV1['options']>>) =>
    onChange({ ...value, options: { ...(value.options ?? {}), ...patch } });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-sm font-medium">{t('admin.accessControl.scenarioEditor.builder.triggersTitle')}</div>
        <div className="space-y-2">
          {value.triggers.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground">
              {t('admin.accessControl.scenarioEditor.builder.triggersEmpty')}
            </div>
          ) : (
            value.triggers.map((tr, idx) => (
              <TriggerEditor
                key={idx}
                value={tr}
                onChange={(next) => setTriggers(value.triggers.map((x, i) => (i === idx ? next : x)))}
                onDelete={() => setTriggers(value.triggers.filter((_, i) => i !== idx))}
                onCopy={() => setTriggers([...value.triggers, { ...tr } as any])}
                disableDelete={value.triggers.length <= 1}
              />
            ))
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setTriggers([...value.triggers, { type: 'MANUAL', enabled: true }])}
          >
            <Plus className="mr-2 size-4" />
            {t('admin.accessControl.scenarioEditor.builder.addTrigger')}
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="text-sm font-medium">{t('admin.accessControl.scenarioEditor.builder.conditionsTitle')}</div>
        {value.conditions ? (
          <ConditionEditor value={value.conditions} onChange={setConditions} />
        ) : (
          <div className="space-y-2">
            <div className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground">
              {t('admin.accessControl.scenarioEditor.builder.conditionsEmpty')}
            </div>
            <Button size="sm" variant="secondary" onClick={() => setConditions({ type: 'ALWAYS' })}>
              <Plus className="mr-2 size-4" />
              {t('admin.accessControl.scenarioEditor.builder.addCondition')}
            </Button>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="text-sm font-medium">{t('admin.accessControl.scenarioEditor.builder.actionsTitle')}</div>
        <div className="space-y-2">
          {value.actions.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground">
              {t('admin.accessControl.scenarioEditor.builder.actionsEmpty')}
            </div>
          ) : (
            value.actions.map((a, idx) => (
              <ActionEditor
                key={idx}
                value={a}
                onChange={(next) => setActions(value.actions.map((x, i) => (i === idx ? next : x)))}
                onDelete={() => setActions(value.actions.filter((_, i) => i !== idx))}
                onMoveUp={() => {
                  if (idx <= 0) return;
                  const copy = [...value.actions];
                  const tmp = copy[idx - 1];
                  copy[idx - 1] = copy[idx];
                  copy[idx] = tmp;
                  setActions(copy);
                }}
                onMoveDown={() => {
                  if (idx >= value.actions.length - 1) return;
                  const copy = [...value.actions];
                  const tmp = copy[idx + 1];
                  copy[idx + 1] = copy[idx];
                  copy[idx] = tmp;
                  setActions(copy);
                }}
                disableDelete={value.actions.length <= 1}
              />
            ))
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setActions([...value.actions, { type: 'DELAY', ms: 1000 }])}
          >
            <Plus className="mr-2 size-4" />
            {t('admin.accessControl.scenarioEditor.builder.addAction')}
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium">{t('admin.accessControl.scenarioEditor.builder.optionsTitle')}</div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm">
              <Settings2 className="mr-2 size-4" />
              {t('admin.accessControl.scenarioEditor.builder.openOptions')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('admin.accessControl.scenarioEditor.builder.optionsDialogTitle')}</DialogTitle>
              <DialogDescription>
                {t('admin.accessControl.scenarioEditor.builder.optionsDialogDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.timezone')}</label>
                <Input
                  value={value.options?.timezone ?? ''}
                  onChange={(e) => setOptions({ timezone: e.target.value || undefined })}
                  placeholder={t('admin.accessControl.scenarioEditor.builder.timezonePlaceholder')}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.debounceMs')}</label>
                <Input
                  type="number"
                  value={value.options?.debounceMs ?? ''}
                  onChange={(e) =>
                    setOptions({ debounceMs: e.target.value === '' ? undefined : Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.maxConcurrency')}</label>
                <Input
                  type="number"
                  value={value.options?.maxConcurrency ?? ''}
                  onChange={(e) =>
                    setOptions({ maxConcurrency: e.target.value === '' ? undefined : Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary">{t('admin.accessControl.scenarioEditor.builder.done')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function TriggerEditor(props: {
  value: ScenarioTriggerV1;
  onChange: (next: ScenarioTriggerV1) => void;
  onDelete: () => void;
  onCopy: () => void;
  disableDelete: boolean;
}) {
  const { value, onChange, onDelete, onCopy, disableDelete } = props;
  const { t } = useTranslation();

  const setType = (type: ScenarioTriggerV1['type']) => {
    if (type === value.type) return;
    if (type === 'SCHEDULE') onChange({ type, cron: '* * * * *', enabled: true });
    if (type === 'MANUAL') onChange({ type, enabled: true });
    if (type === 'DEVICE_EVENT') onChange({ type, deviceId: '', event: '', enabled: true });
    if (type === 'WEBHOOK') onChange({ type, token: generateWebhookToken(), enabled: true });
  };

  const triggerTypeLabel = (type: ScenarioTriggerV1['type']) => {
    switch (type) {
      case 'SCHEDULE':
        return t('admin.accessControl.scenarioEditor.trigger.type.schedule');
      case 'MANUAL':
        return t('admin.accessControl.scenarioEditor.trigger.type.manual');
      case 'DEVICE_EVENT':
        return t('admin.accessControl.scenarioEditor.trigger.type.deviceEvent');
      case 'WEBHOOK':
        return t('admin.accessControl.scenarioEditor.trigger.type.webhook');
    }
  };

  const triggerHint = (type: ScenarioTriggerV1['type']) => {
    switch (type) {
      case 'SCHEDULE':
        return t('admin.accessControl.scenarioEditor.trigger.hint.schedule');
      case 'MANUAL':
        return t('admin.accessControl.scenarioEditor.trigger.hint.manual');
      case 'DEVICE_EVENT':
        return t('admin.accessControl.scenarioEditor.trigger.hint.deviceEvent');
      case 'WEBHOOK':
        return t('admin.accessControl.scenarioEditor.trigger.hint.webhook');
    }
  };

  return (
    <div className="rounded-md border border-border p-2">
      <TooltipProvider delayDuration={200}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={value.type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger className="w-[160px]" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SCHEDULE">{triggerTypeLabel('SCHEDULE')}</SelectItem>
              <SelectItem value="MANUAL">{triggerTypeLabel('MANUAL')}</SelectItem>
              <SelectItem value="DEVICE_EVENT">{triggerTypeLabel('DEVICE_EVENT')}</SelectItem>
              <SelectItem value="WEBHOOK">{triggerTypeLabel('WEBHOOK')}</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={value.enabled}
              onChange={(e) => onChange({ ...value, enabled: e.target.checked } as any)}
            />
            {t('admin.accessControl.scenarioEditor.trigger.enabled')}
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="secondary"
                onClick={onCopy}
                aria-label={t('admin.accessControl.scenarioEditor.trigger.copyAria')}
              >
                <Copy className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>{t('admin.accessControl.scenarioEditor.common.copy')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="destructive"
                onClick={onDelete}
                disabled={disableDelete}
                aria-label={t('admin.accessControl.scenarioEditor.trigger.removeAria')}
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>{t('admin.accessControl.scenarioEditor.common.remove')}</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{triggerHint(value.type)}</p>
      </TooltipProvider>

      {value.type === 'SCHEDULE' && (
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.cron')}</label>
            <Input value={value.cron} onChange={(e) => onChange({ ...value, cron: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.timezone')}</label>
            <Input value={value.timezone ?? ''} onChange={(e) => onChange({ ...value, timezone: e.target.value || undefined })} />
          </div>
        </div>
      )}

      {value.type === 'MANUAL' && (
        <p className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.trigger.manualStart')}</p>
      )}

      {value.type === 'DEVICE_EVENT' && (
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.deviceId')}</label>
            <Input value={value.deviceId} onChange={(e) => onChange({ ...value, deviceId: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.event')}</label>
            <Input value={value.event} onChange={(e) => onChange({ ...value, event: e.target.value })} />
          </div>
        </div>
      )}

      {value.type === 'WEBHOOK' && (
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.token')}</label>
            <Input value={value.token} onChange={(e) => onChange({ ...value, token: e.target.value })} />
          </div>
          <Button size="sm" variant="secondary" onClick={() => onChange({ ...value, token: generateWebhookToken() })}>
            {t('admin.accessControl.scenarioEditor.generate')}
          </Button>
        </div>
      )}
    </div>
  );
}

function ActionEditor(props: {
  value: ScenarioActionV1;
  onChange: (next: ScenarioActionV1) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableDelete: boolean;
}) {
  const { value, onChange, onDelete, onMoveUp, onMoveDown, disableDelete } = props;
  const { t } = useTranslation();

  const setType = (type: ScenarioActionV1['type']) => {
    if (type === value.type) return;
    if (type === 'DELAY') onChange({ type, ms: 1000 });
    if (type === 'DEVICE_COMMAND') onChange({ type, deviceId: '', command: '' });
    if (type === 'NOTIFY') onChange({ type, channel: 'PUSH', message: '' });
    if (type === 'HTTP_REQUEST') onChange({ type, method: 'POST', url: 'https://example.com', timeoutMs: 5000 });
  };

  const actionTypeLabel = (type: ScenarioActionV1['type']) => {
    switch (type) {
      case 'DEVICE_COMMAND':
        return t('admin.accessControl.scenarioEditor.action.type.deviceCommand');
      case 'DELAY':
        return t('admin.accessControl.scenarioEditor.action.type.delay');
      case 'NOTIFY':
        return t('admin.accessControl.scenarioEditor.action.type.notify');
      case 'HTTP_REQUEST':
        return t('admin.accessControl.scenarioEditor.action.type.httpRequest');
    }
  };

  const actionHint = (type: ScenarioActionV1['type']) => {
    switch (type) {
      case 'DEVICE_COMMAND':
        return t('admin.accessControl.scenarioEditor.action.hint.deviceCommand');
      case 'DELAY':
        return t('admin.accessControl.scenarioEditor.action.hint.delay');
      case 'NOTIFY':
        return t('admin.accessControl.scenarioEditor.action.hint.notify');
      case 'HTTP_REQUEST':
        return t('admin.accessControl.scenarioEditor.action.hint.httpRequest');
    }
  };

  return (
    <div className="rounded-md border border-border p-2">
      <TooltipProvider delayDuration={200}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Select value={value.type} onValueChange={(v) => setType(v as any)}>
          <SelectTrigger className="w-[180px]" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DEVICE_COMMAND">{actionTypeLabel('DEVICE_COMMAND')}</SelectItem>
            <SelectItem value="DELAY">{actionTypeLabel('DELAY')}</SelectItem>
            <SelectItem value="NOTIFY">{actionTypeLabel('NOTIFY')}</SelectItem>
            <SelectItem value="HTTP_REQUEST">{actionTypeLabel('HTTP_REQUEST')}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="secondary"
                onClick={onMoveUp}
                aria-label={t('admin.accessControl.scenarioEditor.action.moveUpAria')}
              >
                <ArrowUp className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>{t('admin.accessControl.scenarioEditor.action.up')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="secondary"
                onClick={onMoveDown}
                aria-label={t('admin.accessControl.scenarioEditor.action.moveDownAria')}
              >
                <ArrowDown className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>{t('admin.accessControl.scenarioEditor.action.down')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="destructive"
                onClick={onDelete}
                disabled={disableDelete}
                aria-label={t('admin.accessControl.scenarioEditor.action.removeAria')}
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>{t('admin.accessControl.scenarioEditor.common.remove')}</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{actionHint(value.type)}</p>
      </TooltipProvider>

      {value.type === 'DELAY' && (
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.ms')}</label>
            <Input type="number" value={value.ms} onChange={(e) => onChange({ ...value, ms: Number(e.target.value) })} />
          </div>
          <div className="flex flex-wrap gap-2">
            {[500, 1000, 5000, 30000, 60000].map((ms) => (
              <Button key={ms} size="sm" variant="secondary" onClick={() => onChange({ ...value, ms })}>
                {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
              </Button>
            ))}
          </div>
        </div>
      )}

      {value.type === 'DEVICE_COMMAND' && (
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.deviceId')}</label>
            <Input value={value.deviceId} onChange={(e) => onChange({ ...value, deviceId: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.command')}</label>
            <Input value={value.command} onChange={(e) => onChange({ ...value, command: e.target.value })} />
          </div>
        </div>
      )}

      {value.type === 'NOTIFY' && (
        <div className="space-y-2">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.channel')}</label>
              <Select value={value.channel} onValueChange={(v) => onChange({ ...value, channel: v as any })}>
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUSH">PUSH</SelectItem>
                  <SelectItem value="EMAIL">EMAIL</SelectItem>
                  <SelectItem value="TELEGRAM">TELEGRAM</SelectItem>
                  <SelectItem value="WEB">WEB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.title')}</label>
              <Input value={value.title ?? ''} onChange={(e) => onChange({ ...value, title: e.target.value || undefined })} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.message')}</label>
            <Textarea value={value.message} onChange={(e) => onChange({ ...value, message: e.target.value })} />
          </div>
        </div>
      )}

      {value.type === 'HTTP_REQUEST' && (
        <div className="space-y-2">
          <div className="grid gap-2 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.method')}</label>
              <Input value={value.method} onChange={(e) => onChange({ ...value, method: e.target.value })} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.url')}</label>
              <Input value={value.url} onChange={(e) => onChange({ ...value, url: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.timeoutMs')}</label>
            <Input
              type="number"
              value={value.timeoutMs ?? ''}
              onChange={(e) => onChange({ ...value, timeoutMs: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ConditionEditor(props: {
  value: ScenarioConditionV1;
  onChange: (next: ScenarioConditionV1 | undefined) => void;
}) {
  const { value, onChange } = props;
  const { t } = useTranslation();

  const setType = (type: ScenarioConditionV1['type']) => {
    if (type === value.type) return;
    if (type === 'ALWAYS') onChange({ type });
    if (type === 'DEVICE_STATE') onChange({ type, deviceId: '', path: '', op: 'EQ', value: null });
    if (type === 'TIME_WINDOW') onChange({ type, from: '09:00', to: '18:00' });
    if (type === 'AND') onChange({ type, items: [{ type: 'ALWAYS' }] });
    if (type === 'OR') onChange({ type, items: [{ type: 'ALWAYS' }] });
    if (type === 'NOT') onChange({ type, item: { type: 'ALWAYS' } });
  };

  const conditionTypeLabel = (type: ScenarioConditionV1['type']) => {
    switch (type) {
      case 'ALWAYS':
        return t('admin.accessControl.scenarioEditor.condition.type.always');
      case 'DEVICE_STATE':
        return t('admin.accessControl.scenarioEditor.condition.type.deviceState');
      case 'TIME_WINDOW':
        return t('admin.accessControl.scenarioEditor.condition.type.timeWindow');
      case 'AND':
        return t('admin.accessControl.scenarioEditor.condition.type.and');
      case 'OR':
        return t('admin.accessControl.scenarioEditor.condition.type.or');
      case 'NOT':
        return t('admin.accessControl.scenarioEditor.condition.type.not');
    }
  };

  const conditionHint = (type: ScenarioConditionV1['type']) => {
    switch (type) {
      case 'ALWAYS':
        return t('admin.accessControl.scenarioEditor.condition.hint.always');
      case 'DEVICE_STATE':
        return t('admin.accessControl.scenarioEditor.condition.hint.deviceState');
      case 'TIME_WINDOW':
        return t('admin.accessControl.scenarioEditor.condition.hint.timeWindow');
      case 'AND':
        return t('admin.accessControl.scenarioEditor.condition.hint.and');
      case 'OR':
        return t('admin.accessControl.scenarioEditor.condition.hint.or');
      case 'NOT':
        return t('admin.accessControl.scenarioEditor.condition.hint.not');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={value.type} onValueChange={(v) => setType(v as any)}>
          <SelectTrigger className="w-[180px]" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALWAYS">{conditionTypeLabel('ALWAYS')}</SelectItem>
            <SelectItem value="DEVICE_STATE">{conditionTypeLabel('DEVICE_STATE')}</SelectItem>
            <SelectItem value="TIME_WINDOW">{conditionTypeLabel('TIME_WINDOW')}</SelectItem>
            <SelectItem value="AND">{conditionTypeLabel('AND')}</SelectItem>
            <SelectItem value="OR">{conditionTypeLabel('OR')}</SelectItem>
            <SelectItem value="NOT">{conditionTypeLabel('NOT')}</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="secondary" onClick={() => onChange(undefined)}>
          {t('admin.accessControl.scenarioEditor.condition.resetAlways')}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{conditionHint(value.type)}</p>

      {value.type === 'DEVICE_STATE' && (
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.deviceId')}</label>
            <Input value={value.deviceId} onChange={(e) => onChange({ ...value, deviceId: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.path')}</label>
            <Input value={value.path} onChange={(e) => onChange({ ...value, path: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.op')}</label>
            <Select value={value.op} onValueChange={(v) => onChange({ ...value, op: v as any })}>
              <SelectTrigger className="w-full" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'IN', 'NOT_IN', 'CONTAINS'].map((op) => (
                  <SelectItem key={op} value={op}>
                    {op}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.valueJson')}</label>
            <Input
              value={JSON.stringify(value.value)}
              onChange={(e) => {
                try {
                  onChange({ ...value, value: JSON.parse(e.target.value) });
                } catch {
                  onChange({ ...value, value: e.target.value });
                }
              }}
            />
          </div>
        </div>
      )}

      {value.type === 'TIME_WINDOW' && (
        <div className="grid gap-2 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.from')}</label>
            <Input value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.to')}</label>
            <Input value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('admin.accessControl.scenarioEditor.fields.timezone')}</label>
            <Input value={value.timezone ?? ''} onChange={(e) => onChange({ ...value, timezone: e.target.value || undefined })} />
          </div>
        </div>
      )}

      {(value.type === 'AND' || value.type === 'OR') && (
        <div className="space-y-2">
          {value.items.map((it, idx) => (
            <div key={idx} className="rounded-md border border-border p-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {t('admin.accessControl.scenarioEditor.condition.conditionIndex', { index: idx + 1 })}
                </span>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-sm"
                        variant="destructive"
                        onClick={() => onChange({ ...value, items: value.items.filter((_, i) => i !== idx) } as any)}
                        disabled={value.items.length <= 1}
                        aria-label={t('admin.accessControl.scenarioEditor.condition.removeAria')}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>{t('admin.accessControl.scenarioEditor.common.remove')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <ConditionEditor
                value={it}
                onChange={(next) =>
                  onChange({
                    ...value,
                    items: value.items.map((x, i) => (i === idx ? (next ?? { type: 'ALWAYS' }) : x)),
                  } as any)
                }
              />
            </div>
          ))}
          <Button size="sm" variant="secondary" onClick={() => onChange({ ...value, items: [...value.items, { type: 'ALWAYS' }] } as any)}>
            {t('admin.accessControl.scenarioEditor.builder.addCondition')}
          </Button>
        </div>
      )}

      {value.type === 'NOT' && (
        <div className="rounded-md border border-border p-2">
          <ConditionEditor
            value={value.item}
            onChange={(next) => onChange({ ...value, item: next ?? { type: 'ALWAYS' } })}
          />
        </div>
      )}
    </div>
  );
}

