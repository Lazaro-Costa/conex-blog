import { TestingModule, Test } from '@nestjs/testing'
import { AuthorsPrismaRepository } from './authors.prisma.repository'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'node:child_process'
import { NotFoundError } from '@/shared/errors/not-found-error'
import { AuthorDataBuilder } from '../helpers/author-data-builder'

describe('AuthorsPrismaRepository Integration Tests', () => {
  let module: TestingModule
  let repository: AuthorsPrismaRepository
  const prisma = new PrismaClient()

  beforeAll(async () => {
    execSync('npm run prisma:migrateteste')
    await prisma.$connect()
    module = await Test.createTestingModule({}).compile()
    repository = new AuthorsPrismaRepository(prisma as any)
  })

  beforeEach(async () => {
    await prisma.author.deleteMany()
  })

  afterAll(async () => {
    await module.close()
  })

  test('should throw an error when author is not found', async () => {
    await expect(
      repository.findById('75714d4e-50e8-46dc-8182-d6f5ce99359a'),
    ).rejects.toThrow(
      new NotFoundError(
        `Author not found using id: 75714d4e-50e8-46dc-8182-d6f5ce99359a`,
      ),
    )
  })
  test('should find an author by id', async () => {
    const data = AuthorDataBuilder({})
    const author = await prisma.author.create({ data })

    const result = await repository.findById(author.id)
    expect(result).toStrictEqual(author)
  })
  test('should create an Author', async () => {
    const data = AuthorDataBuilder({})
    const result = await repository.create(data)
    expect(result).toMatchObject(data)
  })
  describe('should search an Author', () => {
    test('should apply pagination when the params are null', async () => {
      const createAt = new Date()
      const data = []
      const arrange = Array(16).fill(AuthorDataBuilder({}))
      arrange.forEach((element, index) => {
        const timeStamp = createAt.getTime() + index
        data.push({
          ...element,
          email: `author${index}@a.com`,
          createdAt: new Date(timeStamp),
        })
      })

      await prisma.author.createMany({ data })
      const result = await repository.search({})
      expect(result.total).toBe(16)
      expect(result.items.length).toBe(15)
      result.items.forEach(item => {
        expect(item.id).toBeDefined()
      })
    })
  })
})
