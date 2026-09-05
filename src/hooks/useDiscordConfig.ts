import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  getDiscordBotConfig,
  saveDiscordBotConfig,
  type DiscordBotConfig,
} from "@/services/discordService";

export function useDiscordConfig() {
  const { user, profile, level } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["discord_bot_config"],
    queryFn: () => getDiscordBotConfig(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const mutation = useMutation({
    mutationFn: (newConfig: DiscordBotConfig) =>
      saveDiscordBotConfig(newConfig, user, profile, level),
    onSuccess: (_, newConfig) => {
      queryClient.setQueryData(["discord_bot_config"], newConfig);
      toast.success("Configurações do Discord & Bot salvas com sucesso!", {
        icon: "🤖",
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Falha ao salvar configurações do Discord.");
    },
  });

  return {
    config: query.data,
    isLoading: query.isLoading,
    isSaving: mutation.isPending,
    error: query.error,
    refetch: query.refetch,
    saveConfig: mutation.mutateAsync,
  };
}
