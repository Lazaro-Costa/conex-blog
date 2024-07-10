import { PrismaService } from '@/database/prisma/prisma.service'
import { Author } from '../graphql/models/author'
import {
  IAuthorsRepository,
  SearchParams,
  SearchResult,
} from '../interfaces/authors.repository'
import { ICreateAuthor } from '../interfaces/create-author'
import { NotFoundError } from '@/shared/errors/not-found-error'

export class AuthorsPrismaRepository implements IAuthorsRepository {
  constructor(private prisma: PrismaService) {}
  sortableFiedls: string[] = ['name', 'email', 'createdAt']
  async create(data: ICreateAuthor): Promise<Author> {
    return this.prisma.author.create({ data })
  }
  update(author: Author): Promise<Author> {
    throw new Error('Method not implemented.')
  }
  delete(id: string): Promise<Author> {
    throw new Error('Method not implemented.')
  }
  async findById(id: string): Promise<Author> {
    return await this.get(id)
  }
  findByEmail(email: string): Promise<Author> {
    throw new Error('Method not implemented.')
  }
  search(params: SearchParams): Promise<SearchResult> {
    throw new Error('Method not implemented.')
  }
  async get(id: string): Promise<Author> {
    const author = await this.prisma.author.findUnique({
      where: { id },
    })

    if (!author) {
      throw new NotFoundError(`Author not found using id: ${id}`)
    }
    return author
  }
}
