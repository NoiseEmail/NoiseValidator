export type SerializedGenericError = {
    id: string,
    message: string,
    hint?: string,
    code: number,
    data: object,
    type: string,
    errors: Array<SerializedGenericError>
}