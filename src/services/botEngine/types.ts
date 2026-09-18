export type BotStatus = "online" | "offline" | "error";

export type ActionType =
  | "send_message"
  | "reply_message"
  | "edit_message"
  | "delete_message"
  | "add_role"
  | "remove_role"
  | "set_status"
  | "database_insert"
  | "database_update"
  | "http_request"
  | "execute_webhook"
  | "set_variable"
  | "condition_branch"
  | "delay"
  | "execute_command"
  | "log_audit"
  | "send_notification";

export type EventTriggerType =
  | "message_create"
  | "member_join"
  | "member_leave"
  | "command_ran"
  | "bot_ready"
  | "bot_stop"
  | "webhook_received"
  | "custom";

export type ScheduleType =
  | "interval"
  | "daily"
  | "weekly"
  | "monthly"
  | "specific_date";

export type VariableScope = "global" | "bot" | "user" | "temporary" | "execution";
export type VariableType = "string" | "number" | "boolean" | "json";

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "greater_or_equal"
  | "less_or_equal"
  | "is_empty"
  | "is_not_empty"
  | "has_role"
  | "has_permission";

export interface ConditionItem {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
}

export interface ConditionGroup {
  id: string;
  logic: "AND" | "OR";
  conditions: ConditionItem[];
}

export interface BotAction {
  id: string;
  type: ActionType;
  name?: string;
  order: number;
  config: Record<string, any>;
  thenActions?: BotAction[];
  elseActions?: BotAction[];
}

export interface CommandParameter {
  id: string;
  name: string;
  type: "string" | "number" | "user" | "channel" | "role" | "boolean";
  required: boolean;
  description: string;
  defaultValue?: string;
}

export interface BotCommand {
  id: string;
  botId: string;
  guildId?: string; // ID do servidor específico ou 'all' para todos
  name: string;
  prefix?: string;
  description: string;
  usage?: string;
  aliases?: string[];
  enabled: boolean;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  channelIds?: string[];
  parameters: CommandParameter[];
  conditions: ConditionGroup[];
  actions: BotAction[];
  createdAt: string;
  updatedAt: string;
}

export interface BotEvent {
  id: string;
  botId: string;
  guildId?: string; // ID do servidor específico ou 'all' para todos
  name: string;
  triggerType: EventTriggerType;
  enabled: boolean;
  description: string;
  filterConfig?: {
    channelIds?: string[];
    ignoredUserIds?: string[];
    requirePrefix?: boolean;
    containsText?: string;
  };
  conditions: ConditionGroup[];
  actions: BotAction[];
  createdAt: string;
  updatedAt: string;
}

export interface BotTimer {
  id: string;
  botId: string;
  guildId?: string; // ID do servidor específico ou 'all' para todos
  name: string;
  description: string;
  scheduleType: ScheduleType;
  scheduleConfig: {
    intervalMinutes?: number;
    timeOfDay?: string; // "14:30"
    daysOfWeek?: number[]; // [0 = Dom, 1 = Seg, ...]
    dayOfMonth?: number;
    specificDate?: string; // "2026-09-15T12:00"
    timezone?: string; // "America/Sao_Paulo"
  };
  enabled: boolean;
  repeat: boolean;
  startDate?: string;
  endDate?: string;
  lastRunAt?: string;
  nextRunAt?: string;
  executionCount: number;
  conditions: ConditionGroup[];
  actions: BotAction[];
  createdAt: string;
  updatedAt: string;
}

export interface BotVariable {
  id: string;
  botId: string;
  name: string;
  description: string;
  scope: VariableScope;
  type: VariableType;
  value: string;
}

export interface ExecutionTraceItem {
  stepId: string;
  stepName: string;
  type: string;
  success: boolean;
  output?: any;
  error?: string;
  durationMs?: number;
}

export interface ExecutionLog {
  id: string;
  botId: string;
  source: "command" | "event" | "timer" | "test";
  triggerName: string;
  triggeredBy: {
    id?: string;
    name?: string;
    username?: string;
  };
  startedAt: string;
  durationMs: number;
  status: "success" | "error" | "warning";
  stepsExecuted: number;
  error?: string;
  trace: ExecutionTraceItem[];
}

export interface BotStats {
  commandsCount: number;
  eventsCount: number;
  timersCount: number;
  totalExecutions: number;
  lastExecutedAt?: string;
  errorsCount: number;
}

export interface BotProject {
  id: string;
  name: string;
  description: string;
  prefix: string;
  avatarUrl: string;
  status: BotStatus;
  enabled: boolean;
  guildId: string;
  applicationId?: string;
  createdAt: string;
  updatedAt: string;
  stats: BotStats;
  commands: BotCommand[];
  events: BotEvent[];
  timers: BotTimer[];
  variables: BotVariable[];
}

export interface BotEngineConfig {
  maxExecutionStepsPerRun: number;
  loopProtectionTimeoutMs: number;
  enableAuditLogs: boolean;
  enableDiscordRealtime: boolean;
}

export interface ExecutionContext {
  bot: BotProject;
  user?: {
    id?: string;
    name?: string;
    username?: string;
    roles?: string[];
    permissions?: string[];
  };
  channel?: {
    id?: string;
    name?: string;
  };
  message?: {
    id?: string;
    content?: string;
  };
  args?: Record<string, any>;
  vars: Record<string, any>;
  source: "command" | "event" | "timer" | "test";
  triggerName: string;
}
