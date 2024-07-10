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
  async search(params: SearchParams): Promise<SearchResult> {
    const { page = 1, perPage = 15, filter, sort, sortDir } = params
    const sortable = this.sortableFiedls?.includes(sort) || false
    const orderByField = sortable ? sort : 'createdAt'
    const orderByDir = sortable ? sortDir : 'desc'

    const count = await this.prisma.author.count({
      ...(filter && {
        where: {
          OR: [
            { name: { contains: filter, mode: 'insensitive' } },
            { email: { contains: filter, mode: 'insensitive' } },
          ],
        },
      }),
    })
    const authors = await this.prisma.author.findMany({
      ...(filter && {
        where: {
          OR: [
            { name: { contains: filter, mode: 'insensitive' } },
            { email: { contains: filter, mode: 'insensitive' } },
          ],
        },
      }),
      orderBy: { [orderByField]: orderByDir },
      skip: (page - 1) * perPage,
      take: perPage,
    })
    return {
      items: authors,
      currentPage: page,
      perPage,
      lastPage: Math.ceil(count / perPage),
      total: count,
    }
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
