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

/**
 * Retorna um Map de member_id -> MemberTag[] para renderização rápida e enriquecimento de listas de membros
 */
export function useMemberTagsMap() {
  const { data: tags = [] } = useMemberTags();
  const { data: assignments = [] } = useMemberTagAssignments();

  return useMemo(() => {
    const tagMap = new Map<string, MemberTag>();
    tags.forEach((t) => tagMap.set(t.id, t));

    const memberTagsMap: Record<string, MemberTag[]> = {};

    assignments.forEach((a) => {
      const tag = tagMap.get(a.tag_id);
      if (tag) {
        if (!memberTagsMap[a.member_id]) {
          memberTagsMap[a.member_id] = [];
        }
        memberTagsMap[a.member_id].push(tag);
      }
    });

    return memberTagsMap;
  }, [tags, assignments]);
}

/**
 * Retorna as tags do usuário atualmente logado
 */
export function useMyMemberTags() {
  const { profile, user } = useAuth();
  const tagsMap = useMemberTagsMap();

  return useMemo(() => {
    const memberId = profile?.id || user?.id;
    if (!memberId) return [];
    return tagsMap[memberId] || [];
  }, [tagsMap, profile?.id, user?.id]);
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
    }) => updateTagPermissionsAndRules(tagId, permissions, rules),
    onSuccess: () => {
      toast.success("Permissões e regras da tag atualizadas com sucesso!");
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

  return {
    saveTagMutation,
    deleteTagMutation,
    updatePermissionsAndRulesMutation,
    toggleAssignmentMutation,
    setMemberTagsMutation,
    setTagMembersMutation,
  };
}
