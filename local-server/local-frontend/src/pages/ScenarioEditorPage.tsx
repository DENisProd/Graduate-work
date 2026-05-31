import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/hooks/useI18n'
import { getScenario, createScenario, updateScenario } from '@/api/scenarios'
import { ScenarioDefinitionEditor } from '@/components/shared/ScenarioDefinitionEditor'
import type { ScenarioDefinition } from '@/types'

const EMPTY_DEFINITION: ScenarioDefinition = {
  triggers: [{ type: 'manual' }],
  actions: [{ type: 'log_message', message: 'Scenario executed' }],
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      {children}
      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

export function ScenarioEditorPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [houseId, setHouseId] = useState('')
  const [definition, setDefinition] = useState<ScenarioDefinition>(EMPTY_DEFINITION)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: existing, isPending: loadingExisting } = useQuery({
    queryKey: ['scenario', id],
    queryFn: () => getScenario(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setDescription(existing.description ?? '')
      setHouseId(existing.houseId ?? '')
      setDefinition(existing.definition)
    }
  }, [existing])

  const mutation = useMutation({
    mutationFn: () =>
      isEdit
        ? updateScenario(id!, { name, description: description || undefined, houseId: houseId || undefined, definition })
        : createScenario({ name, description: description || undefined, houseId: houseId || undefined, definition }),
    onSuccess: () => {
      toast.success(isEdit ? t('scenarioEditor.toastUpdated') : t('scenarioEditor.toastCreated'))
      queryClient.invalidateQueries({ queryKey: ['scenarios'] })
      navigate('/scenarios')
    },
    onError: () => toast.error(t('scenarioEditor.toastSaveFailed')),
  })

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = t('scenarioEditor.errNameRequired')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) mutation.mutate()
  }

  if (isEdit && loadingExisting) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/scenarios')}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {isEdit ? t('scenarioEditor.editTitle') : t('scenarioEditor.newTitle')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic fields */}
        <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{t('scenarioEditor.general')}</p>

          <Field label={t('scenarioEditor.name')} error={errors.name}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('scenarioEditor.namePlaceholder')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </Field>

          <Field label={t('scenarioEditor.description')}>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('scenarioEditor.descriptionPlaceholder')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </Field>

          <Field label={t('scenarioEditor.houseId')}>
            <input
              value={houseId}
              onChange={(e) => setHouseId(e.target.value)}
              placeholder={t('scenarioEditor.housePlaceholder')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </Field>
        </div>

        {/* Definition editor — re-mount when existing scenario loads */}
        <ScenarioDefinitionEditor
          key={existing?.id ?? 'new'}
          value={definition}
          onChange={setDefinition}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/scenarios')}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {t('scenarioEditor.cancel')}
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {mutation.isPending
              ? t('scenarioEditor.saving')
              : isEdit
                ? t('scenarioEditor.saveChanges')
                : t('scenarioEditor.create')}
          </button>
        </div>
      </form>
    </div>
  )
}
