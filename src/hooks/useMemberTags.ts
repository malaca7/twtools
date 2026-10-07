import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  getMemberTags,
  getMemberTagAssignments,
  saveMemberTag,
  deleteMemberTag,
  updateTagPermissionsAndRules,
  toggleMemberTagAssignment,
  setMemberTags,
  setTagMembers,
  updateMemberTagsOrder,
  type MemberTag,
  type MemberTagAssignment,
  type MemberTagRules,
} from "@/services/memberTagsService";
import type { Permission } from "@/lib/permissions";
import { useAuth } from "@/hooks/useAuth";

export function useMemberTags() {
  return useQuery({
    queryKey: ["member_tags"],
    queryFn: getMemberTags,
    staleTime: 30000,
  });
}

export function useMemberTagAssignments() {
  return useQuery({
    queryKey: ["member_tag_assignments"],
    queryFn: getMemberTagAssignments,
    staleTime: 30000,
  });
}

import { useMembers } from "@/hooks/useData";

/**
 * Retorna um Map de member_id / user_id -> MemberTag[] para renderização rápida e enriquecimento de listas de membros.
 * Por padrão, tags ativas são retornadas ordenadas por ordem de nível (order_index).
 */
export function useMemberTagsMap(options: { onlySystem?: boolean } = { onlySystem: true }) {
  const { data: tags = [] } = useMemberTags();
  const { data: assignments = [] } = useMemberTagAssignments();
  const { data: members = [] } = useMembers();

  return useMemo(() => {
    const tagMap = new Map<string, MemberTag>();
    tags.forEach((t) => {
      if (t.is_active === false) return;
      if (options.onlySystem && !t.is_system) return;
      tagMap.set(t.id, t);
    });

    const memberIdToUserId = new Map<string, string>();
    const userIdToMemberId = new Map<string, string>();
    members.forEach((m) => {
      if (m.id && m.user_id) {
        memberIdToUserId.set(m.id, m.user_id);
        userIdToMemberId.set(m.user_id, m.id);
      }
    });

    const memberTagsMap: Record<string, MemberTag[]> = {};

    assignments.forEach((a) => {
      const tag = tagMap.get(a.tag_id);
      if (tag) {
        const ids = new Set<string>();
        if (a.member_id) {
          ids.add(a.member_id);
          const alt1 = memberIdToUserId.get(a.member_id);
          if (alt1) ids.add(alt1);
          const alt2 = userIdToMemberId.get(a.member_id);
          if (alt2) ids.add(alt2);
        }

        ids.forEach((id) => {
          if (!memberTagsMap[id]) {
            memberTagsMap[id] = [];
          }
          if (!memberTagsMap[id].some((t) => t.id === tag.id)) {
            memberTagsMap[id].push(tag);
          }
        });
      }
    });

    // Ordena as tags de cada membro por ordem de nível (order_index)
    Object.keys(memberTagsMap).forEach((id) => {
      memberTagsMap[id].sort((a, b) => (a.order_index ?? 999) - (b.order_index ?? 999));
    });

    return memberTagsMap;
  }, [tags, assignments, members, options.onlySystem]);
}

/**
 * Retorna as tags do usuário atualmente logado
 */
export function useMyMemberTags(): MemberTag[] {
  const { profile, user } = useAuth();
  const tagsMap = useMemberTagsMap();

  return useMemo(() => {
    const candidateIds = [
      profile?.id,
      user?.id,
      profile?.user_id,
      (profile as any)?.member_id,
    ].filter(Boolean) as string[];

    for (const id of candidateIds) {
      if (tagsMap[id] && tagsMap[id].length > 0) {
        return tagsMap[id];
      }
    }
    return [];
  }, [tagsMap, profile?.id, user?.id, profile?.user_id]);
}

/**
 * Mutations úteis para interagir com tags
 */
export function useMemberTagMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["member_tags"] });
    void queryClient.invalidateQueries({ queryKey: ["member_tag_assignments"] });
    void queryClient.invalidateQueries({ queryKey: ["members"] });
  };

  const saveTagMutation = useMutation({
    mutationFn: saveMemberTag,
    onSuccess: (data) => {
      toast.success(`Tag "${data.name}" salva com sucesso!`);
      invalidate();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar tag.");
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: deleteMemberTag,
    onSuccess: () => {
      toast.success("Tag removida com sucesso!");
      invalidate();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao remover tag.");
    },
  });

  const updatePermissionsAndRulesMutation = useMutation({
    mutationFn: ({
      tagId,
      permissions,
      rules,
    }: {
      tagId: string;
      permissions: Permission[];
      rules: MemberTagRules;
      silent?: boolean;
    }) => updateTagPermissionsAndRules(tagId, permissions, rules),
    onSuccess: (_, variables) => {
      if (!variables?.silent) {
        toast.success("Permissões e regras da tag atualizadas com sucesso!");
      }
      invalidate();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao atualizar permissões e regras da tag.");
    },
  });

  const toggleAssignmentMutation = useMutation({
    mutationFn: ({
      memberId,
      tagId,
      assignedBy,
    }: {
      memberId: string;
      tagId: string;
      assignedBy?: string;
    }) => toggleMemberTagAssignment(memberId, tagId, assignedBy),
    onSuccess: (res) => {
      toast.success(res.assigned ? "Tag vinculada ao membro!" : "Tag desvinculada do membro!");
      invalidate();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao alternar tag do membro.");
    },
  });

  const setMemberTagsMutation = useMutation({
    mutationFn: ({
      memberId,
      tagIds,
      assignedBy,
    }: {
      memberId: string;
      tagIds: string[];
      assignedBy?: string;
    }) => setMemberTags(memberId, tagIds, assignedBy),
    onSuccess: () => {
      toast.success("Tags do membro atualizadas com sucesso!");
      invalidate();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao atualizar tags do membro.");
    },
  });

  const setTagMembersMutation = useMutation({
    mutationFn: ({
      tagId,
      memberIds,
      assignedBy,
    }: {
      tagId: string;
      memberIds: string[];
      assignedBy?: string;
    }) => setTagMembers(tagId, memberIds, assignedBy),
    onSuccess: () => {
      toast.success("Membros vinculados à tag atualizados com sucesso!");
      invalidate();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao atualizar membros da tag.");
    },
  });

  const updateTagsOrderMutation = useMutation({
    mutationFn: (orderedTagIds: string[]) => updateMemberTagsOrder(orderedTagIds),
    onSuccess: () => {
      toast.success("Ordem e hierarquia das tags atualizadas com sucesso!");
      invalidate();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao atualizar ordem das tags.");
    },
  });

  return {
    saveTagMutation,
    deleteTagMutation,
    updatePermissionsAndRulesMutation,
    toggleAssignmentMutation,
    setMemberTagsMutation,
    setTagMembersMutation,
    updateTagsOrderMutation,
  };
}
