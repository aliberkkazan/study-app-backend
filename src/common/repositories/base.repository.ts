import { Repository, FindOptionsWhere, FindManyOptions, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { BaseEntity } from '../entities/base.entity';
import { BaseFilterDto } from '../dto/base-filter.dto';

/**
 * Response interface for paginated results
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Base repository with soft delete and filtering capabilities
 * Extend this for all repositories to get common functionality
 */
export class BaseRepository<T extends BaseEntity> extends Repository<T> {
  /**
   * Soft delete - sets active to false instead of hard deleting
   * @param id - ID of the record to soft delete
   */
  async deactivate(id: string): Promise<void> {
    await this.update(id as any, { active: false } as any);
  }

  /**
   * Soft delete multiple records
   * @param ids - Array of IDs to soft delete
   */
  async deactivateMany(ids: string[]): Promise<void> {
    await this.update(ids as any, { active: false } as any);
  }

  /**
   * Restore a soft-deleted record
   * @param id - ID of the record to restore
   */
  async activate(id: string): Promise<void> {
    await this.update(id as any, { active: true } as any);
  }

  /**
   * Find with filters, pagination, and sorting
   * @param filters - Filter parameters (pagination, sorting, date range)
   * @param additionalWhere - Additional where conditions specific to the entity
   * @returns Paginated response with data and metadata
   */
  async findWithFilters(
    filters: BaseFilterDto,
    additionalWhere?: FindOptionsWhere<T>,
  ): Promise<PaginatedResponse<T>> {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'created_at', 
      sortOrder = 'DESC', 
      startDate, 
      endDate 
    } = filters;

    const where: any = {
      active: true, // Only get active records by default
      ...additionalWhere,
    };

    // Add date filtering if provided
    if (startDate && endDate) {
      where.created_at = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.created_at = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.created_at = LessThanOrEqual(new Date(endDate));
    }

    const [data, total] = await this.findAndCount({
      where,
      order: { [sortBy]: sortOrder } as any,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find all active records
   * @param options - Additional find options
   * @returns Array of active records
   */
  async findAllActive(options?: FindManyOptions<T>): Promise<T[]> {
    return this.find({
      ...options,
      where: {
        ...options?.where,
        active: true,
      } as any,
    });
  }

  /**
   * Find one active record by ID
   * @param id - ID of the record
   * @returns Active record or null
   */
  async findOneActiveById(id: string): Promise<T | null> {
    return this.findOne({
      where: {
        id,
        active: true,
      } as any,
    });
  }

  /**
   * Find one active record by custom conditions
   * @param where - Where conditions
   * @returns Active record or null
   */
  async findOneActive(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.findOne({
      where: {
        ...where,
        active: true,
      } as any,
    });
  }

  /**
   * Count active records
   * @param where - Optional where conditions
   * @returns Count of active records
   */
  async countActive(where?: FindOptionsWhere<T>): Promise<number> {
    return this.count({
      where: {
        ...where,
        active: true,
      } as any,
    });
  }
}
