import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import Layout from '../components/Layout';
import MockCard from '../components/MockCard'; // Import the new card
import Button from '../components/Button';     // Import the new button
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function Dashboard() {
  const mocks = useLiveQuery(() => db.mocks.orderBy('createdAt').reverse().toArray());

  if (!mocks) return <Layout>Loading...</Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inbox</h2>
        {/* Example usage of Button as a Link wrapper or standard button */}
        <Link to="/add">
            <Button variant="primary" size="sm" icon={Plus}>New Mock</Button>
        </Link>
      </div>

      {mocks.length === 0 ? (
        <div className="text-center text-gray-400 py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="mb-4">No mocks recorded yet.</p>
            <Link to="/add">
                <Button variant="secondary">Add your first Question</Button>
            </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mocks.map((mock) => (
            <MockCard key={mock.id} mock={mock} />
          ))}
        </div>
      )}
    </Layout>
  );
}