export const HORARIOS_COWORKING = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
export function validarFormatoData(data: unknown): data is string {
    if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return false;
    }
    const [ano, mes, dia] = data.split("-").map(Number);
    const dataConvertida = new Date(Date.UTC(ano, mes - 1, dia));
    return (dataConvertida.getUTCFullYear() === ano &&
        dataConvertida.getUTCMonth() === mes - 1 &&
        dataConvertida.getUTCDate() === dia);
}
export function reservaEhFutura(reserva: {
    data: string;
    hora: number;
}, agora: Date) {
    const [ano, mes, dia] = reserva.data.split("-").map(Number);
    const instante = new Date(ano, mes - 1, dia, Number(reserva.hora), 0, 0, 0);
    return instante.getTime() > agora.getTime();
}
