CREATE OR REPLACE FUNCTION dev_update_insignia_reason_rpc(
    p_grant_id UUID,
    p_new_reason TEXT
) RETURNS VOID AS $$
BEGIN
    IF NOT public.is_dev_or_ceo() THEN
        RAISE EXCEPTION 'Acesso negado: Apenas Desenvolvedores ou CEO podem editar as justificativas.';
    END IF;

    UPDATE public.member_insignias
    SET 
        reason = p_new_reason,
        updated_at = NOW()
    WHERE id = p_grant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
