export interface CreateCourseDto {
    title: string,
    description: string,
    instructorId: string,
    bannerImageUrl?: string,
    isPaid?: boolean,
    price?: number,
    subCategoryIds?: string[]
}