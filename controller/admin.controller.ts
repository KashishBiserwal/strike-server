import { type NextFunction, type Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { ExtendedRequest } from '../utils/middleware'
import helper from '../utils/helpers'
import crypto from 'crypto'
const prisma = new PrismaClient()
const SALT_ROUND = process.env.SALT_ROUND!
const ITERATION = 100
const KEYLENGTH = 10
const DIGEST_ALGO = 'sha512'

////////////////////////////////////////////////////////////////////////// STORE CONTROLLER //////////////////////////////////////////////////////////////////////////////

const getStores = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const stores = await prisma.store.findMany()
        return res.send({ valid: true, stores })
    } catch (err) {
        return next(err)
    }
}

const getStoreById = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const store = await prisma.store.findUnique({
            where: { id: parseInt(id) }
        })
        if(!store) {
            return res.send({ valid: false, error: 'Store not found.', error_description: 'Store does not exist' })
        }
        return res.send({ valid: true, store })
    } catch (err) {
        return next(err)
    }
}

const updateStore = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { name, address, phone, storeLocation } = req.body
        const store = await prisma.store.update({
            where: { id: parseInt(id) },
            data: {
                name,
                address,
                phone,
                storeLocation
            },
        })
        if(!store) {
            return res.send({ valid: false, error: 'Store not found.', error_description: 'Store does not exist' })
        }
        return res.send({ valid: true, store })
    } catch (err) {
        return res.send({ valid: false, error: 'Store not found.', error_description: 'Store does not exist' })
    }
}

const deleteStore = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const store = await prisma.store.delete({
            where: { id: parseInt(id) },
        })
        if(!store) {
            return res.send({ valid: false, error: 'Store not found.', error_description: 'Store does not exist' })
        }
        return res.send({ valid: true, store })
    } catch (err) {
        return res.send({ valid: false, error: 'Store not found.', error_description: 'Store does not exist' })
    }
}

const createStore = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const { name, address, phone, storeLocation } = req.body
        const isValidPayload = helper.isValidatePaylod(req.body, ['name', 'address', 'phone'])
        if (!isValidPayload) {
            return res.send({ status: 400, error: 'Invalid payload', error_description: 'store name, address and phone are requried.' })
        }
        const store = await prisma.store.create({
            data: {
                name,
                address,
                phone,
                storeLocation
            },
        })
        return res.send({ valid: true, store })
    } catch (err) {
        return next(err)
    }
}


////////////////////////////////////////////////////////////////////////// EMPLOYEE CONTROLLER //////////////////////////////////////////////////////////////////////////////

const createEmployee = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, storeId, accessTo, employeeId, phone } = req.body;

        const isValidPayload = helper.isValidatePaylod(req.body, ['email', 'password', 'storeId']);
        if (!isValidPayload) {
            return res.status(400).send({
                status: 400,
                error: 'Invalid payload',
                error_description: 'email, password, and storeId are required.',
            });
        }

        const s_id = parseInt(storeId);

        const employeeExist = await prisma.employee.findFirst({
            where: { OR: [{ email: email }, { phone: phone }] }
        })

        if(employeeExist) {
            return res.status(400).send({
                status: 400,
                error: 'Invalid payload',
                error_description: 'Employee email or phone already exist.',
            });
        }

        const storeExist = await prisma.store.findUnique({
            where: { id: s_id }
        })
        if(!storeExist) {
            return res.status(400).send({
                status: 400,
                error: 'Invalid payload',
                error_description: 'Store does not exist.', 
            });
        }

        const hash_password = crypto.pbkdf2Sync(password, SALT_ROUND, ITERATION, KEYLENGTH, DIGEST_ALGO).toString('hex');

        const employee = await prisma.employee.create({
            data: {
                name,
                email,
                password: hash_password, 
                storeId: s_id,
                accessTo,
                employeeId,
                phone,
            },
        });

        const { password: _, ...employeeWithoutPassword } = employee;
        return res.status(200).send({ valid: true, employee: employeeWithoutPassword });
    } catch (err) {
        return next(err);
    }
};


const updateEmployeeDetails = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, email, storeId, accessTo, employeeId, phone } = req.body;

        const employee = await prisma.employee.update({
            where: { id: parseInt(id) },
            data: {
                name,
                email,
                storeId,
                accessTo,
                employeeId,
                phone,
            },
        });

        const { password: _, ...employeeWithoutPassword } = employee;
        return res.status(200).send({ valid: true, employee: employeeWithoutPassword });
    } catch (err) {
        return next(err);
    }
}

const updateEmployeePassword = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        const hash_password = crypto.pbkdf2Sync(password, SALT_ROUND, ITERATION, KEYLENGTH, DIGEST_ALGO).toString('hex');

        const employee = await prisma.employee.update({
            where: { id: parseInt(id) },
            data: {
                password: hash_password,
            },
        });

        const { password: _, ...employeeWithoutPassword } = employee;
        return res.status(200).send({ valid: true, employee: employeeWithoutPassword });
    } catch (err) {
        return next(err);
    }
}

const deleteEmployee = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const employee = await prisma.employee.delete({
            where: { id: parseInt(id) },
        });

        const { password: _, ...employeeWithoutPassword } = employee;
        return res.status(200).send({ valid: true, employee: employeeWithoutPassword });
    } catch (err) {
        return res.send({ valid: false, error: 'Employee not found.', error_description: 'Employee does not exist' });
    }
}

const getEmployees = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const employees = await prisma.employee.findMany({
            where: {
            role: {
                not: 'ADMIN'
            }
            },
            select: {
            id: true,
            name: true,
            email: true,
            storeId: true,
            accessTo: true,
            employeeId: true,
            phone: true
            },
            orderBy: {
            createdAt: 'desc'
            }
        });
        return res.status(200).send({ valid: true, employees });
    } catch (err) {
        return next(err);
    }
}

const getEmployeeById = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const employee = await prisma.employee.findUnique({
            where: { id: parseInt(id) },
        });

        if (!employee) {
            return res.status(200).send({ valid: false, error: 'Employee not found.', error_description: 'Employee does not exist' });
        }
        
        const { password: _, ...employeeWithoutPassword } = employee;
        return res.status(200).send({ valid: true, employee: employeeWithoutPassword });
    } catch (err) {
        return next(err);
    }
}

////////////////////////////////////////////////////////////////////////// PACKAGE CONTROLLER //////////////////////////////////////////////////////////////////////////////
const createPackage = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const { name, price, title, description, overs } = req.body;
        const isValidPayload = helper.isValidatePaylod(req.body, ['name', 'price', 'overs']);
        if (!isValidPayload) {
            return res.send({ status: 400, error: 'Invalid payload', error_description: 'name, price and overs are required.' });
        }

        if(isNaN(Number(price))) {
            return res.send({ status: 400, error: 'Invalid payload', error_description: 'price must be a integer.' });
        }
        
        const newPackage = await prisma.package.create({
            data: {
                name,
                title,
                price: parseInt(price),
                description,
                overs: parseInt(overs)
            },
        })
        return res.send({ valid: true, newPackage })
    } catch (err) {
        return next(err)
    }
}

const getAllPackages = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const packages = await prisma.package.findMany()
        return res.send({ valid: true, packages })
    } catch (err) {
        return next(err)
    }
}

const updatePackage = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { name, price, title, description, overs } = req.body
        const updatedPackage = await prisma.package.update({
            where: { id: parseInt(id) },
            data: {
                name,
                title,
                price,
                description,
                overs
            },
        })
        return res.send({ valid: true, updatedPackage })
    } catch (err) {
        return res.send({ valid: false, error: 'Package not found.', error_description: 'Package does not exist' })
    }
}

const deletePackage = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const deletedPackage = await prisma.package.delete({
            where: { id: parseInt(id) },
        })
        return res.send({ valid: true, deletedPackage })
    } catch (err) {
        return res.send({ valid: false, error: 'Package not found.', error_description: 'Package does not exist' })
    }
}

const getPackageById = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const packageDetails = await prisma.package.findUnique({
            where: { id: parseInt(id) }
        })
        if(!packageDetails) {
            return res.send({ valid: false, error: 'Package not found.', error_description: 'Package does not exist' })
        }
        return res.send({ valid: true, packageDetails })
    } catch (err) {
        return next(err)
    }
}

const getBookings = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const bookings = await prisma.booking.findMany({orderBy: {createdAt: 'desc'}, include: {store: true, customer: true, package: true}})
        return res.send({ valid: true, bookings })
    } catch (err) {
        return next(err)
    }
}

const getBookingsByStore = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const { storeId } = req.params
        const store = await prisma.store.findUnique({where: {id: parseInt(storeId)}})
        if(!store) {
            return res.send({ valid: false, error: 'Store not found.', error_description: 'Store does not exist' })
        }
        const bookings = await prisma.booking.findMany({where: {storeId: parseInt(storeId)}, orderBy: {createdAt: 'desc'}, include: {store: true, customer: true, package: true}})
        return res.send({ valid: true, bookings })
    } catch (err) {
        return next(err)
    }
}

const createBooking = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
        const { packageId, storeId, customerId, bookingType, overs, price } = req.body;
        const isValidPayload = helper.isValidatePaylod(req.body, ['storeId', 'customerId', 'bookingType']);
        if(!isValidPayload) {
            return res.send({ status: 400, error: 'Invalid payload', error_description: 'storeId, customerId, bookingType are required.' });
        }
        const customer = await prisma.customer.findUnique({where: {id: parseInt(customerId)}})
        if(!customer) {
            return res.send({ valid: false, error: 'Customer not found.', error_description: 'Customer does not exist' })
        }
        const store = await prisma.store.findUnique({where: {id: parseInt(storeId)}})
        if(!store) {
            return res.send({ valid: false, error: 'Store not found.', error_description: 'Store does not exist' })
        }
        if(bookingType === 'Package') {
            const packagee = await prisma.package.findUnique({where: {id: parseInt(packageId)}})
            if(!packagee) {
                return res.send({ valid: false, error: 'Package not found.', error_description: 'Package does not exist' })
            }
            const packageBooking = await prisma.booking.create({
                data: {
                    storeId: parseInt(storeId),
                    customerId: parseInt(customerId),
                    bookingType: 'Package',
                    packageId: parseInt(packageId),
                    price: packagee.price,
                    overs: packagee.overs
                }
            })
            return res.send({ valid: true, booking: packageBooking })
        }
        if(bookingType === 'Custom') {
            if(!price) {
                return res.send({ status: 400, error: 'Invalid payload', error_description: 'price is required.' });
            }
            if(isNaN(Number(price))) {
                return res.send({ status: 400, error: 'Invalid payload', error_description: 'price must be a integer.' });
            }
            if(!overs) {
                return res.send({ status: 400, error: 'Invalid payload', error_description: 'overs is required.' });
            }
            if(isNaN(Number(overs))) {
                return res.send({ status: 400, error: 'Invalid payload', error_description: 'overs must be a integer.' });
            }
            const customBooking = await prisma.booking.create({
                data: {
                    storeId: parseInt(storeId),
                    customerId: parseInt(customerId),
                    bookingType: 'Custom',
                    price: parseInt(price),
                    overs: parseInt(overs),
                }
            })
            return res.send({ valid: true, booking: customBooking })
        }
        return res.send({ valid: false, message: "Failed to create booking" })
    } catch (err) {
        console.log(err);
        return next(err);
    }
};

const adminController = { 
        getStores,
        createStore,
        getStoreById, 
        updateStore, 
        deleteStore, 
        createEmployee, 
        updateEmployeeDetails, 
        updateEmployeePassword, 
        deleteEmployee, 
        getEmployees, 
        getEmployeeById,
        createPackage,
        getAllPackages,
        updatePackage, 
        deletePackage,
        getPackageById,
        getBookings,
        getBookingsByStore,
        createBooking
    }
export default adminController