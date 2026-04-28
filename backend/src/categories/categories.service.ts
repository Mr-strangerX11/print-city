import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IsString, IsOptional } from 'class-validator';
import slugify from 'slugify';
import { Category, CategoryDocument } from './schemas/category.schema';

export class CreateCategoryDto {
  @IsString() name: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsString() parentId?: string;
}

@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category.name) private categoryModel: Model<CategoryDocument>) {}

  async findAll() {
    const categories = await this.categoryModel
      .find({ parentId: null })
      .sort({ name: 1 })
      .lean()
      .exec();

    // Load children for each root category
    const result = await Promise.all(
      categories.map(async (cat) => {
        const children = await this.categoryModel.find({ parentId: cat._id }).lean().exec();
        return { ...cat, children };
      }),
    );

    return result;
  }

  async findOne(slug: string) {
    const cat = await this.categoryModel.findOne({ slug }).lean().exec();
    if (!cat) throw new NotFoundException('Category not found');

    const children = await this.categoryModel.find({ parentId: cat._id }).lean().exec();
    return { ...cat, children };
  }

  async create(dto: CreateCategoryDto) {
    const slug = slugify(dto.name, { lower: true, strict: true });
    const existing = await this.categoryModel.findOne({ slug }).exec();
    if (existing) throw new ConflictException('Category already exists');

    const cat = new this.categoryModel({
      name: dto.name,
      slug,
      image: dto.image,
      parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : undefined,
    });
    return cat.save();
  }

  async update(id: string, dto: Partial<CreateCategoryDto & { description?: string }>) {
    const cat = await this.categoryModel.findById(id).exec();
    if (!cat) throw new NotFoundException();

    const data: Record<string, any> = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
      data.slug = slugify(dto.name, { lower: true, strict: true });
    }
    if (dto.image !== undefined) data.image = dto.image;
    if (dto.parentId !== undefined) {
      data.parentId = dto.parentId ? new Types.ObjectId(dto.parentId) : null;
    }

    if (Object.keys(data).length === 0) return cat;
    return this.categoryModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async remove(id: string) {
    await this.categoryModel.findByIdAndDelete(id).exec();
    return { deleted: true };
  }
}
