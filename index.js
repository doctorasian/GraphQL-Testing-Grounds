const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { v1: uuid } = require('uuid') //Provides unique values to ID field in addPerson mutation
const { GraphQLError } = require('graphql')

let persons = [
    {
        name: "Francis Nguyen",
        phone: "230-12345",
        street: "Kale 24 Ave",
        city: "Esperanza",
        zip_code: 4215,
        id: "4d5928-1234-423bc-1248523a8df0"
    },
    {
        name: "John Doe",
        phone: "214-21453",
        street: "Tool Kit Six",
        city: "Dell",
        zip_code: 4524,
        id: "1c58-24312-124125h802a93"
    },
    {
        name: "Jane Doe",
        phone: "124-52312",
        street: "Mundane Telephone",
        city: "Triumph",
        zip_code: 4502,
        id: "9c3a-53281-52382-1f93295410"
    },
]

// GraphQL Schema containing types of objects
// ! = Non-nullable object, omitted ! symbolizes nullable return value
const typeDefs = `
    
    #Mutations in GraphQL are operations that cause change
    type Mutation {

        #"addPerson" is a mutation that receives information through parameters
        #and returns a Person if successful, or null if it's not.
        addPerson(
            name: String!
            city: String!
            phone: String
            street: String!
            #note, ID is not specified as parameter, server generates unique ID using uuid library
        ): Person
        
        #edit number takes in name and phone params and returns nullable type Person
        editNumber(
            name: String!
            phone: String!
        ): Person
    }

    type Address {
        street: String!
        city: String!
    }

    type Person {
        name: String!
        phone: String #could return null or a scalar type (string)
        address: Address!
        id: ID!
    }

    #enumerable has two possible values: YES or NO
    enum YesNo {
        YES
        NO
    }

    type Query {
        personCount: Int!
        allPersons(phone: YesNo): [Person!]! #phone param has type YesNo, but is nullable
        findPerson(name: String!): Person
    }
`

//Apollo Server requires resolvers, which populates data into 
//every field in our Query schema, so that the server can respond to requests
//for that data.
const resolvers = {
    Query: {
        personCount: () => persons.length,
        allPersons: (root, args) => {
            //if no phone param provided, return persons
            if (!args.phone) {
                return persons
            }
            //if phone param provided:
            const byPhone = (person) =>
                //if YES, then return all persons with a phone number
                //else (NO case), return all persons WITHOUT a phone number
                args.phone === 'YES' ? person.phone : !person.phone
            return persons.filter(byPhone) //we filter based on our byPhone handler
        },
        findPerson: (root, args) =>
            persons.find(p => p.name === args.name)
    },
    Person: {
        //Address requires a self-defined resolver (default resolver is insufficient)
        //noted as object within an object that does not have an id reference
        address: (root) => {
            return {
                street: root.street,
                city: root.city,
                zip_code: root.zip_code
            }
        }
    },
    Mutation: {
        addPerson: (root, args) => {
            //GraphQL error handling with our GraphQLError var defined in our header
            //For every addPerson mutation, if we try to add an existing name,
            //throw an error.
            if (persons.find(p => p.name === args.name )) {
                throw new GraphQLError('Name must be unique', {
                    extensions: {
                        code: 'BAD_USER_INPUT',
                        invalidArgs: args.name
                    }
                })
            }
            const person = { ...args, id: uuid() } //defines a person with given params 
                                                   //and unique id generated using uuid library
            persons = persons.concat(person) //joins new person into persons list
            return person //return person (or null if unsuccessful)
        },

        editPerson: (root, args) => {
            //mutation finds existing name in our server
            const person = persons.find(p => p.name === args.name)
            //if usernotfound, then return null (our mutation return value is nullable)
            if (!person) {
                return null
            }

            const updatedPerson = { ...person, phone: args.phone }
            persons = persons.map(p => p.name === args.name ? updatedPerson : p )
            return updatedPerson
        }
    }
}

const server = new ApolloServer({
    typeDefs, //GraphQL Schema
    resolvers,
})

startStandaloneServer(server, {
    listen: { port: 4000 },
}).then(({ url }) => {
    console.log(`Server ready at ${url}`)
})