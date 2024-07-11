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

  describe('FindById', () => {
    test('should find an author by id', async () => {
      const data = AuthorDataBuilder({})
      const author = await prisma.author.create({ data })

      const result = await repository.findById(author.id)
      expect(result).toStrictEqual(author)
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
  })

  describe('Create', () => {
    test('should create an Author', async () => {
      const data = AuthorDataBuilder({})
      const result = await repository.create(data)
      expect(result).toMatchObject(data)
    })
  })

  describe('Update', () => {
    test('should throw an error when author ID is not found on update method', async () => {
      const data = AuthorDataBuilder({})
      const author = {
        id: '75714d4e-50e8-46dc-8182-d6f5ce99359a',
        ...data,
      }
      await expect(repository.update(author)).rejects.toThrow(
        new NotFoundError(
          `Author not found using id: 75714d4e-50e8-46dc-8182-d6f5ce99359a`,
        ),
      )
    })
    test('should update an Author', async () => {
      const data = AuthorDataBuilder({})
      const author = await prisma.author.create({ data })
      const result = await repository.update({
        ...author,
        name: 'test',
        email: 'test@test.com',
      })
      expect(result.name).toBe('test')
      expect(result.email).toBe('test@test.com')
    })
  })

  describe('Delete', () => {
    test('should throw an error when author ID is not found on delete method', async () => {
      await expect(
        repository.delete('75714d4e-50e8-46dc-8182-d6f5ce99359a'),
      ).rejects.toThrow(
        new NotFoundError(
          `Author not found using id: 75714d4e-50e8-46dc-8182-d6f5ce99359a`,
        ),
      )
    })
    test('should delete an Author', async () => {
      const data = AuthorDataBuilder({})
      const author = await prisma.author.create({ data })

      const result = await repository.delete(author.id)
      expect(result).toMatchObject(author)
    })
  })

  describe('FindByEmail', () => {
    test('should return null when finding a unexistent email Author', async () => {
      const result = await repository.findByEmail('test@test.com')
      expect(result).toBeNull()
    })
    test('should return an Author by email', async () => {
      const data = AuthorDataBuilder({})
      const author = await prisma.author.create({ data })

      const result = await repository.findByEmail(author.email)
      expect(result).toMatchObject(author)
    })
  })

  describe('Search', () => {
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
      result.items.reverse().forEach((item, index) => {
        expect(`${item.email}${index + 1}@a.com`)
      })
    })
    test('should apply pagination and ordering', async () => {
      const createAt = new Date()
      const data = []
      const arrange = 'badec'
      arrange.split('').forEach((element, index) => {
        const timeStamp = createAt.getTime() + index
        data.push({
          ...AuthorDataBuilder({ name: element }),
          email: `author${index}@a.com`,
          createdAt: new Date(timeStamp),
        })
      })

      await prisma.author.createMany({ data })
      const result1 = await repository.search({
        page: 1,
        perPage: 2,
        sort: 'name',
        sortDir: 'asc',
      })

      expect(result1.items[0]).toMatchObject(data[1])
      expect(result1.items[1]).toMatchObject(data[0])

      const result2 = await repository.search({
        page: 2,
        perPage: 2,
        sort: 'name',
        sortDir: 'asc',
      })

      expect(result2.items[0]).toMatchObject(data[4])
      expect(result2.items[1]).toMatchObject(data[2])
    })
    test('should apply pagination, filter and ordering', async () => {
      const createAt = new Date()
      const data = []
      const arrange = ['test', 'a', 'TEST', 'b', 'Test']
      arrange.forEach((element, index) => {
        const timeStamp = createAt.getTime() + index
        data.push({
          ...AuthorDataBuilder({ name: element }),
          email: `author${index}@a.com`,
          createdAt: new Date(timeStamp),
        })
      })

      await prisma.author.createMany({ data })
      const result1 = await repository.search({
        page: 1,
        perPage: 2,
        sort: 'name',
        sortDir: 'asc',
        filter: 'TEST',
      })

      expect(result1.items[0]).toMatchObject(data[0])
      expect(result1.items[1]).toMatchObject(data[4])

      const result2 = await repository.search({
        page: 2,
        perPage: 2,
        sort: 'name',
        sortDir: 'asc',
        filter: 'TEST',
      })

      expect(result2.items[0]).toMatchObject(data[2])
      expect(result2.items.length).toBe(1)
    })
  })
})
